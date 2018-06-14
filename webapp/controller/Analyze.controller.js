sap.ui.define([
	"DashboardBuilder/controller/BaseController", "sap/m/MessageBox"
], function(BaseController, MessageBox) {
	"use strict";
	return BaseController.extend("DashboardBuilder.controller.Analyze", {
		onInit: function() {
			this.formattedUrlObj = {};
		},
		modifyObj: function() {
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
					if (filteredModel[j].filter === oModel.filters[i].filter) {
						oModel.filters[i].filter = filteredModel[j].name;

						for (k in filteredModel[j].options) {
							for (l in oModel.filters[i].value) {
								if (filteredModel[j].options[k].value === oModel.filters[i].value[l]) {
									oModel.filters[i].value[l] = filteredModel[j].options[k].name;
								}
							}
						}
					} else if (filteredModel[j].name === oModel.filters[i].filter) {
						oModel.filters[i].filter = filteredModel[j].filter;

						for (k in filteredModel[j].options) {
							for (l in oModel.filters[i].value) {
								if (filteredModel[j].options[k].name === oModel.filters[i].value[l]) {
									oModel.filters[i].value[l] = filteredModel[j].options[k].value;
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
			this.getView().byId("userFriendlySwitch").setState(false);
			var objAllFiltersParameters = this.urlFormatter();
			// retrieves the MDR type and sets the value in the MDR Type box
			var mdrValue = objAllFiltersParameters.mdr;
			var oValue = this.dashTypeText(mdrValue);
			this.getView().byId("urlBox").setValue(oValue);

			// everything from the giant object to arrays, divided into Filters (keys and values) and Parameters (keys and values)
			var arrayFKeys = Object.keys(objAllFiltersParameters.filters);
			// var arrayFValues = Object.values(objAllFiltersParameters.filters);
			var arrayFValues = Object.keys(objAllFiltersParameters.filters).map(function (key) { return objAllFiltersParameters.filters[key]; });
			var arrayPKeys = Object.keys(objAllFiltersParameters.params);
			// var arrayPValues = Object.values(objAllFiltersParameters.params);
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
			this.bindDataAnalyzeLists(this.formattedUrlObj);
		},
		urlFormatter: function() {
			var url = this.getView().byId("inputBox").getValue();

			url = url.replace(/%20/g, " ").replace(/%27/g, "'").replace(/%3B/gi, ";");

			var urlSplit = url.split("_f.html?");
			urlSplit[0] = urlSplit[0].slice(urlSplit[0].indexOf("mdr"));
			urlSplit[1] = urlSplit[1].slice(urlSplit[1].indexOf("=") + 1);

			var filterString = urlSplit[1].substring(0, urlSplit[1].indexOf("&"));
			var paramString = urlSplit[1].substring(urlSplit[1].indexOf("&") + 1);

			// verification for missing operators in URL, if there are errors, user needs to fix it
			var eqVerification = filterString.split(/ +(?=(?:(?:[^']*'){2})*[^']*$)/g); // splits by spaces, but only those outside quotes

			var i, posCompOperator = 1,
				posLogiOperator = 3,
				containsError = 0,
				locationError = "",
				errorCode = 0;

			var arrayCompOperators = ["eq", "ne", "ge", "le"];
			var arrayLogiOperators = ["and", "or"];

			for (i = 0; i < eqVerification.length; i++) {
				if (i === posCompOperator) {
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
						filtersKeysValues.activity_service_team = [];
						keyValue = keyValue.slice(11);
						var serviceTeams = keyValue.split(";");
						for (var value in serviceTeams) {
							filtersKeysValues.activity_service_team.push(serviceTeams[value]);
						}
					} else {
						if (filtersKeysValues[keyName]) { // if name already exists - when the same filter is encountered multiple times
							if (typeof filtersKeysValues[keyName] === "string") { // if the value inside is still a string...
								filtersKeysValues[keyName] = [filtersKeysValues[keyName]]; // ...transform to array, so we can add multiple values by pushing...
							}
							filtersKeysValues[keyName].push(keyValue); // ...pushing new values if name already exists...
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
							"<strong>Filters: </strong>" + "<em>" + url.substring(url.indexOf("=") + 1, errorStartPosition) +
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
			oView.byId("userFriendlySwitch").setState(false);
			oView.byId("filtersTable").unbindItems();
			oView.byId("paramsTable").unbindItems();
			oView.byId("urlBox").setValue("");
			oView.byId("inputBox").setValue("");
		}
	});
});