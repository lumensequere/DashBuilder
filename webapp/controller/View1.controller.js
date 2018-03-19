sap.ui.define(["sap/ui/core/mvc/Controller", "sap/m/MessageToast"], function(Controller, MessageToast) {
	"use strict";
	return Controller.extend("DashboardBuilder.controller.View1", {
		/**
		 *@memberOf DashboardBuilder.controller.View1
		 */
		 
		onInit: function () {
			this.itemObj = {};
			this.itemObj.items = [];
			this.oModel = new sap.ui.model.json.JSONModel();
			this.oModel.setData(this.itemObj);
			
			this.itemArray = [];
		},
		dashSelection: function () {
			this.itemObj = {};
			this.itemObj.items = [];
			this.oModel.setData(this.itemObj);
		},
		onExit: function () {
			if (this.oDialog) {
				this.oDialog.destroy(true);
				delete this.oDialog;
			}
		},
		generateUrl: function () {
			var mdrType = this.getView().byId("dashType").getSelectedKey();
			var oData = this.oModel.getData();
			var i;
			
			var urlStringGateway = "https://pgp.wdf.sap.corp/sap/bc/ui5_ui5/sap/zs_dashboard/f/";
			var urlStringAfterType = "_f.html?filter=";
			
			var urlStringFilters = "";
			var urlStringParams = "";
			
			var filterArray = [];
			var paramArray = [];
			
			for (i = 0; i < oData.items.length; i++) {
				if (oData.items[i].desc.startsWith("&")) {
					paramArray.push(oData.items[i]);
				} else {
					filterArray.push(oData.items[i]);
				}
			}
			
			for (i = 0; i < filterArray.length; i++) {
				if (i !== 0) {
					urlStringFilters = urlStringFilters + " and ";
				}
				if (filterArray[i].value.length > 1) {
					for (var j = 0; j < filterArray[i].value.length; j++) {
						if (j === 0) {
							urlStringFilters = urlStringFilters + "(";
						} else if (j < filterArray[i].value.length) {
							urlStringFilters = urlStringFilters + " or ";
						}
						
						urlStringFilters = urlStringFilters + filterArray[i].desc + " eq '" + filterArray[i].value[j] + "'";
						
						if (j === filterArray[i].value.length - 1) {
							urlStringFilters = urlStringFilters + ")";
						}
					}
				} else {
					urlStringFilters = urlStringFilters + filterArray[i].desc + " eq '" + filterArray[i].value + "'";
				}
			}
			
			for (i = 0; i < paramArray.length; i++) {
				urlStringParams = urlStringParams + paramArray[i].desc + "=" + paramArray[i].value;
			}
			
			var generatedUrlString = urlStringGateway + mdrType + urlStringAfterType + urlStringFilters + urlStringParams;
			this.generatedUrl = generatedUrlString;
			
			if (!this.genDialog) {
				this.genDialog = sap.ui.xmlfragment("DashboardBuilder.view.generation", this);
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.genDialog);
			this.getView().addDependent(this.genDialog);
			sap.ui.getCore().byId("generatedText").setValue(generatedUrlString);
			this.genDialog.open();
		},
		handleParamDialogPress: function () {
			if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment("DashboardBuilder.view.selectionDialog", this);
				this.oDialog.setModel(this.getOwnerComponent().getModel("filters"));
			}
			
			this.oDialog.getBinding("items").filter([new sap.ui.model.Filter("key", "EQ", "all")]);
			
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oDialog);
			this.getView().addDependent(this.oDialog);
			this.oDialog.open();
		},
		openLinksDialog: function () {
			if (!this.linksDialog) {
				this.linksDialog = sap.ui.xmlfragment("DashboardBuilder.view.links", this);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.linksDialog);
				this.getView().addDependent(this.linksDialog);
				this.linksDialog.open();
			}
		},
		closeLinksDialog: function () {
			if (this.linksDialog) {
				this.linksDialog.destroy(true);
				delete this.linksDialog;
			}
		},
		handleSelectDialogPress: function () {
			if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment("DashboardBuilder.view.selectionDialog", this);
				this.oDialog.setModel(this.getOwnerComponent().getModel("filters"));
			}
			
			var oComboBox = this.getView().byId("dashType");
			var mdrTypeKey = oComboBox.getSelectedKey();
			
			this.oDialog.getBinding("items").filter([new sap.ui.model.Filter("key", "EQ", mdrTypeKey)]);
			
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oDialog);
			this.getView().addDependent(this.oDialog);
			this.oDialog.open();
		},
		handleData: function () {
			var oList = this.getView().byId("selectedList");
			var oData = this.oModel.getData();
			
			var existsName = 0;
			var index = 0;
			for (var i = 0; i < oData.items.length; i++) {
				var obj = oData.items[i];
				if (obj.filter === this.itemArray.filter) {
					existsName = 1;
					index = i;
				}
			}
			
			if (existsName === 0) {
				oData.items.unshift(this.itemArray);
			} else {
				oData.items.splice(index, 1);
				oData.items.unshift(this.itemArray);
			}
			
			var oItemTemplate = new sap.m.DisplayListItem();
			oItemTemplate.bindProperty("label", {
				path: "filter"
			});
			oItemTemplate.bindProperty("value", {
				path: "value"
			});
			
			var oBindingInfo = {
				path: "/items",
				template: oItemTemplate
			};
			
			this.oModel.setData(oData);
			
			oList.setModel(this.oModel);
			oList.bindItems(oBindingInfo);
		},
		onDelete: function (oEvent) {
			var oSelectedItem = oEvent.getParameter("listItem");
			var sPath = oSelectedItem.getBindingContext().getPath();
			var iSelectedItemIndex = parseInt(sPath.substring(sPath.lastIndexOf("/")+1));
			
			var oList = this.getView().byId("selectedList");
			var oData = this.oModel.getData();
			oData.items.splice(iSelectedItemIndex, 1);
			this.oModel.setData(oData);
			oList.setModel(this.oModel);
		},
		handleClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function(oContext) { return oContext.getObject().name; }).join(", "));
				
				var selectedItem = oEvent.getParameter("selectedItem");
				
				this.itemArray = {};
				this.itemArray.filter = selectedItem.getTitle(); // i.e. Status
				this.itemArray.desc = selectedItem.getDescription(); // i.e. activity_status
				
				var littleObj = {};
				littleObj.name = selectedItem.getTitle();
				littleObj.info = selectedItem.getInfo(); // i.e. select
				littleObj.path = selectedItem.getBindingContext().getPath(); // i.e. /1/something
				
				oEvent.getSource().getBinding("items").filter([]);
				
				this.handleDialogs(littleObj);
			} else {
				MessageToast.show("No new item was selected.");
			}
		},
		handleSelectClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function(oContext) { return oContext.getObject().name; }).join(", "));
				var tempArray = aContexts.map(function(oContext) { return oContext.getObject().value; }).join(",");
				this.itemArray.value = tempArray.split(",");
				this.handleData();
				oEvent.getSource().getBinding("items").filter([]);
			} else {
				MessageToast.show("No new item was selected.");
			}
			
			this.secDialog.destroy(true);
			delete this.secDialog;
		},
		handleGenerationClose: function (oEvent) {
			var target = oEvent.getSource().data("target");
			switch (target) {
				case "browser":
					window.open(this.generatedUrl);
					break;
				case "close":
				default:
					this.genDialog.destroy(true);
					delete this.genDialog;
					break;
			}
		},
		handleInputClose: function () {
			var input = sap.ui.getCore().byId("userInput").getValue();
			if (input !== "") {
				this.itemArray.value = input.split(",");
				this.handleData();
			}
			
			this.secDialog.destroy(true);
			delete this.secDialog;
		},
		handleDialogs: function (data) {
			var int = 1;
			var owner = this.getOwnerComponent();
			//var dataFilters = Object.keys(this.oModel.items);
			//var dataValues = Object.keys(this.oModel.items);
			
			if (!this.secDialog) {
				if (data.info === "select") {
					this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.select", this);
					switch (data.name) {
						case "Service Team":
							this.secDialog.setModel(owner.getModel("serviceTeams"));
							break;
						case "Status":
							this.secDialog.setModel(owner.getModel("status"));
							/*for (var i = 0; i < dataValues.length; i++) {
								if (dataValues[i].indexOf("Process Type") !== -1) {
									
								}
							}*/
							break;
						case "Category":
							this.secDialog.setModel(owner.getModel("category"));
							break;
						case "Process Type":
							this.secDialog.setModel(owner.getModel("activitytypes"));
							break;
						case "Service Organization":
							this.secDialog.setModel(owner.getModel("serviceorgs"));
							break;
						case "Rating":
							this.secDialog.setModel(owner.getModel("rating"));
							break;
						case "Result":
							this.secDialog.setModel(owner.getModel("result"));
							break;
						case "Priority":
							this.secDialog.setModel(owner.getModel("priority"));
							break;
						default:
							int = 2;
							break;
					}
				} else if (data.info === "input") {
					this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.input", this);
				} else if (data.info === "options") {
					this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.options", this);
					var oModel = new sap.ui.model.json.JSONModel();
					var sModel = owner.getModel("filters");
					var path = data.path;
					var prop = sModel.getProperty(path);
					var sPath = prop.options;
					oModel.setData(sPath);
					
					this.secDialog.setModel(oModel);
				}
			}
			
			if (int !== 2) {
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.secDialog);
				this.getView().addDependent(this.secDialog);
				this.secDialog.open();
			}
		},
		modifyObj: function (data) {
			var obj = {};
			var notEqual = 0;
			var filtrao = data.filter;
			if (filtrao.indexOf("!") !== -1) {
				filtrao = filtrao.replace("!", "");
				notEqual = 1;
			}
			var valorzao = data.value;
			var oModel = this.getOwnerComponent().getModel("filters");
			var oData = oModel.getProperty("/");
			var filter = "";
			for (var i = 0; i < oData.length; i++) {
				filter = oData[i].filter;
				filter = filter.replace("&", "");
				filter = filter.toLowerCase();
				if (filter === filtrao) {
					filtrao = oData[i].name;
				}
			}
			if (notEqual === 1) {
				filtrao = filtrao + " Not Equal";
			}
			if (data) {
				obj.filter = filtrao;
				obj.value = valorzao;
			}
			return obj;
		},
		dashTypeText: function (dashType) {
			var result = "";
			var oModel = this.getOwnerComponent().getModel("dashboards");
			var oData = oModel.getProperty("/");
			
			for (var i = 0; i < oData.length; i++) {
				if (oData[i].key === dashType) {
					result = oData[i].name;
					break;
				}
			}
			
			return result;
		},
		onSubmit: function () {
			var giantObj = this.urlFormatter();
			var mdrValue = giantObj.mdr;
			var oValue = this.dashTypeText(mdrValue);
			this.getView().byId("urlBox").setValue(oValue);
			
			var arrayFKeys = Object.keys(giantObj.filters);
			var arrayFValues = Object.values(giantObj.filters);
			var arrayPKeys = Object.keys(giantObj.params);
			var arrayPValues = Object.values(giantObj.params);
			
			var objFilters = [];
			var objParams = [];
			var tempKeys, tempValues, i;
			for (i = 0; i < arrayFKeys.length; i++) {
				tempKeys = arrayFKeys[i];
				tempValues = arrayFValues[i];
				objFilters[i] = this.modifyObj({
					filter: tempKeys,
					value: tempValues
				});
			}
			for (i = 0; i < arrayPKeys.length; i++) {
				tempKeys = arrayPKeys[i];
				tempValues = arrayPValues[i];
				objParams[i] = this.modifyObj({
					filter: tempKeys,
					value: tempValues
				});
			}
			var objTenso = {};
			objTenso.filters = objFilters;
			objTenso.params = objParams;
			var filtersModel = new sap.ui.model.json.JSONModel();
			filtersModel.setData(objTenso);
			//this.getView().setModel(filtersModel,"all_filters");
			var oItemTemplate = new sap.m.DisplayListItem();
			oItemTemplate.bindProperty("label", {
				path: "filter"
			});
			oItemTemplate.bindProperty("value", {
				path: "value"
			});
			
			var oFBindingInfo = {
				path: "/filters",
				template: oItemTemplate
			};
			var oPBindingInfo = {
				path: "/params",
				template: oItemTemplate
			};
			var filtersList = this.byId("filtersList");
			filtersList.setModel(filtersModel);
			filtersList.bindItems(oFBindingInfo);
			var paramsList = this.byId("paramsList");
			paramsList.setModel(filtersModel);
			paramsList.bindItems(oPBindingInfo);
		},
		urlFormatter: function () {
			var url = this.getView().byId("inputBox").getValue();
			
			url = url.replace(/%20/g, " ");
			url = url.replace(/%27/g, "'");
			
			var urlSplit = url.split("?");
			var posMdr = urlSplit[0].indexOf("mdr");
			var posF = urlSplit[0].indexOf("_f");
			
			urlSplit[0] = urlSplit[0].slice(posMdr, posF);
			urlSplit[1] = urlSplit[1].slice(8, urlSplit[1].length);
			
			var posFirstAnd = urlSplit[1].indexOf("&");
			var filterSplit = urlSplit[1].slice(0, posFirstAnd);
			var paramSplit = urlSplit[1].slice(posFirstAnd + 1, urlSplit[1].length);
			
			filterSplit = filterSplit.replace(new RegExp("\\b"+"or"+"\\b", "gi"), "and");
			filterSplit = filterSplit.replace(/\(|\)/g, "").replace(/eq/g, "=");
			filterSplit = filterSplit.replace(/ne/g, "!=");
			
			var arrayFilters = filterSplit.split(/and/);
			var arrayParam = paramSplit.split("&");
			
			var objAll = {};
			var filters = {};
			var params = {};
			var i, j, k, count = 0;
			
			var sizeFilters = arrayFilters.length;
			var sizeParam = arrayParam.length;
			
			for (i = 0; i < sizeFilters; i++) {
				var a = arrayFilters[i].split("=");
				var paramName = a[0];
				paramName = paramName.replace(/ /g, "");
				var paramValue = typeof (a[1]) === 'undefined' ? true : a[1];
				var indexFirstQuote = paramValue.indexOf("'");
				var indexLastQuote = paramValue.indexOf("'", indexFirstQuote + 1);
				paramValue = paramValue.slice(indexFirstQuote + 1, indexLastQuote);
				var ol = Object.keys(filters);
				count = 0;
				
				paramName = paramName.toLowerCase();
				
				if (paramName === "filter") {
					paramName = "activity_service_team";
					paramValue = paramValue.slice(11);
					paramValue = paramValue.replace(/;/g, ",");
					filters[paramName] = [filters[paramName]];
					var counter = paramValue.split(",");
					filters[paramName][0] = counter[0];
					for (k = 1; k < counter.length; k++) {
						filters[paramName].push(counter[k]);
					}
				} else {
					if (filters[paramName]) {
						if (typeof filters[paramName] === "string") {
							filters[paramName] = [filters[paramName]];
						}
						for (j = 0; j < ol.length; j++) {
							if (ol[j] === paramName) {
								count++;
							}
						}
						if (count > 0) {
							filters[paramName].push(paramValue);
						} else {
							filters[paramName][count] = paramValue;
						}
					} else {
						filters[paramName] = paramValue;
					}
				}
			}
			
			for (i = 0; i < sizeParam; i++) {
				a = arrayParam[i].split("=");
				paramName = a[0];
				paramValue = typeof (a[1]) === 'undefined' ? true : a[1];
				ol = Object.keys(params);
				count = 0;
				paramName = paramName.toLowerCase();
				if (params[paramName]) {
					if (typeof params[paramName] === "string") {
						params[paramName] = [params[paramName]];
					}
					for (j = 0; j < ol.length; j++) {
						if (ol[j] === paramName) {
							count++;
						}
					}
					if (count > 0) {
						params[paramName].push(paramValue);
					} else {
						params[paramName][count] = paramValue;
					}
				} else {
					params[paramName] = paramValue;
				}
			}
			
			objAll.filters = filters;
			objAll.params = params;
			paramName = "mdr";
			var mdr = urlSplit[0];
			objAll[paramName] = [objAll[paramName]];
			objAll[paramName] = mdr;

			return objAll;
		},
		onPress: function (evt) {
			var navCon = this.getView().byId("myContainer");
			var target = evt.getSource().data("target");
			if (target === "buildPage" || target === "overviewPage") {
				this.clearAnalyze();
			}
			if (target) {
				navCon.to(this.getView().byId(target), "slide");
			} else {
				navCon.back();
			}
		},
		clearAnalyze: function () {
			var oView = this.getView();
			oView.byId("filtersList").unbindItems();
			oView.byId("paramsList").unbindItems();
			oView.byId("inputBox").setValue("");
			oView.byId("urlBox").setValue("");
		}
	});
});