sap.ui.define([
	"DashboardBuilder/controller/BaseController", "sap/m/MessageBox", "sap/m/MessageToast"
], function(BaseController, MessageBox, MessageToast) {
	"use strict";
	return BaseController.extend("DashboardBuilder.controller.Analyze", {
		onInit: function() {
			this.formattedUrlObj = {};
		},
		isObjEmpty: function(obj) {
			for (var key in obj) { return false; }
			return true;
		},
		// user friendly switch
		modifyObj: function() {
			if (this.isObjEmpty(this.formattedUrlObj) === false) {
				var i, j, k, l, filteredModel = [],
					parameters = [];
				var oModel = this.formattedUrlObj;
				var mdr = oModel.mdr;
				var filtersModel = this.getOwnerComponent().getModel("filters").getProperty("/");
	
				for (i in filtersModel) {
					if (filtersModel[i].key === mdr) {
						filteredModel.push(filtersModel[i]);
					} else if (filtersModel[i].key === "all") {
						parameters.push(filtersModel[i]);
					}
				}
	
				// conversion tech names to user friendly, and vice versa (filters)
				for (i in oModel.filters) {
					for (j in filteredModel) {
						if (filteredModel[j].filter === oModel.filters[i].filter.trim()) {
							oModel.filters[i].filter = " " + filteredModel[j].name;
	
							for (k in filteredModel[j].options) {
								for (l in oModel.filters[i].value) {
									if (filteredModel[j].options[k].value === oModel.filters[i].value[l].trim()) {
										oModel.filters[i].value[l] = " " + filteredModel[j].options[k].name;
									}
								}
							}
						} else if (filteredModel[j].name === oModel.filters[i].filter.trim()) {
							oModel.filters[i].filter = " " + filteredModel[j].filter;
	
							for (k in filteredModel[j].options) {
								for (l in oModel.filters[i].value) {
									if (filteredModel[j].options[k].name === oModel.filters[i].value[l].trim()) {
										oModel.filters[i].value[l] = " " + filteredModel[j].options[k].value;
									}
								}
							}
						}
					}
				}
	
				// conversion tech names to user friendly, and vice versa (parameters)
				for (i in oModel.params) {
					for (j in parameters) {
						if (parameters[j].filter.toLowerCase() === oModel.params[i].filter.toLowerCase()) {
							oModel.params[i].filter = parameters[j].name;
						} else if (parameters[j].name === oModel.params[i].filter) {
							oModel.params[i].filter = parameters[j].filter;
						}
					}
				}
	
				this.formattedUrlObj = oModel;
				this.bindDataAnalyzeLists(oModel);
			}
		},
		dashTypeText: function(dashType) {
			var result = "";
			var oModel = this.getOwnerComponent().getModel("dashboards");
			var oData = oModel.getProperty("/");

			for (var i = 0; i < oData.length; i++) {
				if (oData[i].key === dashType) {
					result = oData[i].name;
					break;
				}
			}
			result += " (" + dashType.toUpperCase() + ")";

			return result;
		},
		bindDataAnalyzeLists: function(object) {
			var filtersModel = new sap.ui.model.json.JSONModel();
			filtersModel.setData(object);

			var oColumnItemTemplate = new sap.m.ColumnListItem({
				cells: [
					new sap.m.Text({
						text: "{filter}"
					}),
					new sap.m.Text({
						text: "{value}"
					})
				]
			});

			var oFBindingInfo = {
				path: "/filters",
				template: oColumnItemTemplate
			};
			var oPBindingInfo = {
				path: "/params",
				template: oColumnItemTemplate
			};

			var filtersTable = this.byId("filtersTable");
			var paramsTable = this.byId("paramsTable");
			filtersTable.setModel(filtersModel);
			paramsTable.setModel(filtersModel);
			filtersTable.bindItems(oFBindingInfo);
			paramsTable.bindItems(oPBindingInfo);
		},
		onSubmit: function() {
			var objAllFiltersParameters = this.urlFormatter();
			var oView = this.getView();

			// check if the user pressed submit with: empty input field / invalid URL / URL without filters / URL without parameters
			switch (objAllFiltersParameters) {
				case "empty":
					MessageToast.show("Please enter an URL before submitting.");
					return;
				case "invalid":
					MessageToast.show("Please enter a valid dashboard URL.");
					return;
				case "missing":
					MessageToast.show("Please enter a dashboard URL containing filters and parameters.");
					return;
				default:
					break;
			}
			// expands the Results panel once a valid URL has been submitted and analyzed
			oView.byId("resultsPanel").setExpanded(true);

			// retrieves the MDR type and sets the value in the MDR Type box
			var mdrValue = objAllFiltersParameters.mdr;
			var oValue = this.dashTypeText(mdrValue);
			oView.byId("urlBox").setCols(oValue.length).setValue(oValue).setVisible(true);

			// everything from the giant object to arrays, divided into Filters (keys and values) and Parameters (keys and values)
			var arrayFKeys = Object.keys(objAllFiltersParameters.filters);
			var arrayFValues = Object.keys(objAllFiltersParameters.filters).map(function (key) { return objAllFiltersParameters.filters[key]; });
			var arrayPKeys = Object.keys(objAllFiltersParameters.params);
			var arrayPValues = Object.keys(objAllFiltersParameters.params).map(function (key) { return objAllFiltersParameters.params[key]; });

			var arrayFiltersToModify = [],
				arrayParamsToModify = [],
				i;

			for (i in arrayFKeys) {
				arrayFiltersToModify[i] = {
					filter: arrayFKeys[i],
					value: arrayFValues[i]
				};
			}
			for (i in arrayPKeys) {
				arrayParamsToModify[i] = {
					filter: arrayPKeys[i],
					value: arrayPValues[i]
				};
			}

			this.formattedUrlObj.mdr = mdrValue;
			this.formattedUrlObj.filters = arrayFiltersToModify;
			this.formattedUrlObj.params = arrayParamsToModify;

			if (this.getView().byId("userFriendlySwitch").getState() === false) {
				this.bindDataAnalyzeLists(this.formattedUrlObj);
			} else {
				this.modifyObj();
				this.bindDataAnalyzeLists(this.formattedUrlObj);
			}
		},
		urlFormatter: function() {
			var url = this.getView().byId("inputBox").getValue();
			if (url === "") {
				return "empty";
			} else if (url.indexOf("_f.html?") === -1) {
				return "invalid";
			}

			url = url.replace(/%20/g, " ").replace(/%27/g, "'").replace(/%3B/gi, ";");

			var urlSplit = url.split("_f.html?");
			urlSplit[0] = urlSplit[0].slice(urlSplit[0].indexOf("mdr"));
			urlSplit[1] = urlSplit[1].slice(urlSplit[1].indexOf("&filter=") + 8);

			var filterString = urlSplit[1].substring(0, urlSplit[1].indexOf("&"));
			var paramString = urlSplit[1].substring(urlSplit[1].indexOf("&") + 1);

			if (filterString === "" || paramString === "") {
				return "missing";
			}

			// start of verification for missing operators in URL, if there are errors, user needs to fix it
			var eqVerification = filterString.replace(/\(|\)/g, "").trim().split(/ +(?=(?:(?:[^']*'){2})*[^']*$)/g); // splits by spaces, but only those outside quotes

			var i, posCompOperator = 1,
				posFilter = 0,
				containsFilterError = 0,
				filteredModel = [],
				posLogiOperator = 3,
				containsError = 0,
				locationError = "",
				errorCode = 0;

			var arrayCompOperators = ["eq", "ne", "ge", "le"];
			var arrayLogiOperators = ["and", "or"];
			
			var filtersModel = this.getOwnerComponent().getModel("filters").getProperty("/");
			for (i in filtersModel) {
				if (filtersModel[i].key === urlSplit[0]) {
					filteredModel.push(filtersModel[i]);
				}
			}

			for (i = 0; i < eqVerification.length; i++) {
				if (i === posFilter) {
					for (var j in filteredModel) {
						if (filteredModel[j].filter === eqVerification[i]) {
							containsFilterError = 0;
							posFilter += 4;
							break;
						} else {
							containsFilterError = 1;
						}
					}
					if (containsFilterError === 1) {
						containsError = 1;
						locationError = eqVerification[i + 1];
						errorCode = 31;
						break;
					}
				} else if (i === posCompOperator) {
					if (arrayCompOperators.indexOf(eqVerification[i]) === -1) { // error here, was expecting operator and didn't find an exact match, could be an operator or a blank space missing
						containsError = 1;
						if (eqVerification[i - 1].indexOf("eq" || "ne" || "ge" || "le") > -1) { // do we have an operator before? if yes than the error is 1 position before, just a blank space missing
							locationError = eqVerification[i - 1];
							errorCode = 11;
						} else if (eqVerification[i].indexOf("eq" || "ne" || "ge" || "le") > -1) { // do we have an operator at the error position? if yes than it's just a blank space missing
							locationError = eqVerification[i];
							errorCode = 11;
						} else { // else the error is an operator missing
							locationError = eqVerification[i - 1].substring(eqVerification[i - 1].length - 5) + " " + eqVerification[i].substring(0, 5);
							errorCode = 12;
						}
						break;
					} else {
						posCompOperator += 4;
					}
				} else if (i === posLogiOperator) {
					if (arrayLogiOperators.indexOf(eqVerification[i]) === -1) {
						containsError = 1;
						if (eqVerification[i - 1].indexOf("and" || "or") > -1) {
							locationError = eqVerification[i - 1];
							errorCode = 21;
						} else if (eqVerification[i].indexOf("and" || "or") > -1) {
							locationError = eqVerification[i];
							errorCode = 21;
						} else {
							locationError = eqVerification[i - 1].substring(eqVerification[i - 1].length - 5) + " " + eqVerification[i].substring(0, 5);
							errorCode = 22;
						}
						break;
					} else {
						posLogiOperator += 4;
					}
				}
			}
			// end of verification
			// if an error is found, display error message and return null, lists are not updated
			if (containsError === 0) {
				filterString = filterString.replace(new RegExp("\\b" + "or" + "\\b", "gi"), "and").replace(/\(|\)/g, "");
				filterString = filterString.replace(/eq/g, "=").replace(/ne/g, "!=");

				var arrayFilters = filterString.split("and");
				var arrayParam = paramString.split("&");

				var objAllKeysValues = {},
					filtersKeysValues = {},
					paramsKeysValues = {};
				var keyNameAndValue, keyName, keyValue;

				var sizeFilters = arrayFilters.length;
				var sizeParam = arrayParam.length;

				// handles the filters
				for (i = 0; i < sizeFilters; i++) {
					keyNameAndValue = arrayFilters[i].split("=");
					keyName = keyNameAndValue[0].replace(/ /g, "").toLowerCase();
					keyValue = (typeof(keyNameAndValue[1]) === "undefined" || keyNameAndValue[1] === "") ? "NO VALUE" : keyNameAndValue[1]; // if string is undefined (non existent) or blank, true shows "no value", false shows the value
					keyValue = keyValue.replace(/'/g, "").trim();

					if (keyName === "filter") { // check if this magical filter exists (it's different from all the others)
						filtersKeysValues.Filter = [];
						keyValue = keyValue.slice(11);
						var serviceTeams = keyValue.split(";");
						for (var value in serviceTeams) {
							filtersKeysValues.Filter.push(serviceTeams[value]);
						}
					} else {
						if (filtersKeysValues[keyName]) { // if name already exists - when the same filter is encountered multiple times
							if (typeof filtersKeysValues[keyName] === "string") { // if the value inside is still a string...
								filtersKeysValues[keyName] = [filtersKeysValues[keyName]]; // ...transform to array, so we can add multiple values by pushing...
							}
							filtersKeysValues[keyName].push(" " + keyValue); // ...pushing new values if name already exists...
						} else {
							filtersKeysValues[keyName] = [keyValue]; // ... if name doesn't exists, just assign value to object
						}
					}
				}

				// handles the parameters
				for (i = 0; i < sizeParam; i++) {
					keyNameAndValue = arrayParam[i].split("=");
					keyName = keyNameAndValue[0].toLowerCase();
					keyValue = (typeof(keyNameAndValue[1]) === "undefined" || keyNameAndValue[1] === "") ? "NO VALUE" : keyNameAndValue[1];
					paramsKeysValues[keyName] = [keyValue]; // parameters should never be repeated, so just assign value to object
				}

				objAllKeysValues.filters = filtersKeysValues;
				objAllKeysValues.params = paramsKeysValues;
				objAllKeysValues.mdr = urlSplit[0];

				return objAllKeysValues;
			} else {
				if (containsError === 1) {
					var errorStartPosition = url.indexOf(locationError);
					var errorMessage;
					switch (errorCode) {
						case 11:
							errorMessage = "Blank space missing before and/or after comparison operator.";
							break;
						case 12:
							errorMessage = "Comparison operator missing ('eq', 'ne', 'ge', 'le').";
							break;
						case 21:
							errorMessage = "Blank space missing before and/or after logical operator.";
							break;
						case 22:
							errorMessage = "Logical operator missing ('and', 'or').";
							break;
						case 31:
							errorMessage = "Filter doesn't exist or isn't supported by '" + urlSplit[0].toUpperCase() + "' dashboard type.";
							break;
						default:
							errorMessage = "Undefined error.";
							break;
					}
					MessageBox.show("Your URL has an error. View details below, review your URL and try again.", {
						icon: MessageBox.Icon.ERROR,
						title: "Error",
						actions: [sap.m.MessageBox.Action.CLOSE],
						id: "messageBoxURLError",
						details: "<p><strong>Error description: </strong>" + errorMessage + "</p>" +
							"<strong>Gateway: </strong>" + "<em>" + url.substring(0, url.indexOf("=") + 1) + "</em><br>" +
							"<strong>Filters: </strong>" + "<em>" + url.substring(url.indexOf("&filter=") + 8, errorStartPosition) +
							"<span style='color:red;background-color:yellow;font-weight:bold'>" + url.substring(errorStartPosition, errorStartPosition +
								locationError.length) + "</span>" +
							url.substring(errorStartPosition + locationError.length, url.indexOf("&", url.indexOf("&") + 1)) + "</em><br>" +
							"<strong>Parameters: </strong>" + "<em>" + url.substring(url.indexOf("&", url.indexOf("&") + 1)) + "</em>"
					});
				}
				return null;
			}
		},
		clearAnalyze: function() {
			var oView = this.getView();
			this.formattedUrlObj = {};
			oView.byId("resultsPanel").setExpanded(false);
			oView.byId("filtersTable").unbindItems();
			oView.byId("paramsTable").unbindItems();
			oView.byId("urlBox").setValue("").setVisible(false);
			oView.byId("inputBox").setValue("");
		}
	});
});