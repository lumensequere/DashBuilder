sap.ui.define([
	"DashboardBuilder/controller/BaseController", "sap/m/MessageToast"
], function(BaseController, MessageToast) {
	"use strict";
	return BaseController.extend("DashboardBuilder.controller.Build", {
		onInit: function() {
			this.itemObj = {};
			this.itemObj.items = [];
			this.oModel = new sap.ui.model.json.JSONModel();
			this.oModel.setData(this.itemObj);
			this.itemArray = [];
		},
		dashSelection: function() {
			this.itemObj = {};
			this.itemObj.items = [];
			this.oModel.setData(this.itemObj);
		},
		generateUrl: function() {
			// gets the dashboard type selected and stores in mdrType variable. the current selection data is stored inside oData variable
			var mdrType = this.getView().byId("dashType").getSelectedKey();
			var oData = this.oModel.getData();
			var i;

			// basic URL string, to be used later
			var urlStringGateway = "https://pgp.wdf.sap.corp/sap/bc/ui5_ui5/sap/zs_dashboard/f/";
			var urlStringAfterType = "_f.html?filter=";

			// empty variables to be filled with strings to build the URL, and empty arrays to get the data from oData to the strings
			var urlStringFilters = "";
			var urlStringParams = "";
			var filterArray = [];
			var paramArray = [];

			// data from oData is pushed into the arrays
			for (i = 0; i < oData.items.length; i++) {
				if (oData.items[i].desc.startsWith("&")) {
					paramArray.push(oData.items[i]);
				} else {
					filterArray.push(oData.items[i]);
				}
			}
			// data from the arrays is pushed into strings, with spaces/and/or/'/(/). first FOR is for filters, the second is just for parameters
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
				urlStringParams = urlStringParams + "&" + paramArray[i].desc + "=" + paramArray[i].value;
			}

			// URL is being built here and stored into global variable
			var generatedUrlString = urlStringGateway + mdrType + urlStringAfterType + urlStringFilters + urlStringParams;
			this.generatedUrl = generatedUrlString;

			// if generated url dialog doesn't exists, creates it
			if (!this.genDialog) {
				this.genDialog = sap.ui.xmlfragment("DashboardBuilder.view.generation", this);
			}

			// MAGIC and then dialog opening
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.genDialog);
			this.getView().addDependent(this.genDialog);
			sap.ui.getCore().byId("generatedText").setValue(generatedUrlString);
			this.genDialog.open();
		},
		// handleFilterButtonPress: in "Build" page, this function is called when "Add Filter" button is pressed, filters only dashboard filters for the selected type
		handleFilterButtonPress: function() {
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
		// handleParameterButtonPress: in "Build" page, this function is called when "Add Parameter" button is pressed, filters the parameters from the filters.json file (all parameters use the key "all")
		handleParameterButtonPress: function() {
			if (!this.oDialog) {
				this.oDialog = sap.ui.xmlfragment("DashboardBuilder.view.selectionDialog", this);
				this.oDialog.setModel(this.getOwnerComponent().getModel("filters"));
			}

			this.oDialog.getBinding("items").filter([new sap.ui.model.Filter("key", "EQ", "all")]);

			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.oDialog);
			this.getView().addDependent(this.oDialog);
			this.oDialog.open();
		},
		openTemplatesDialog: function() {
			if (!this.templatesDialog) {
				this.templatesDialog = sap.ui.xmlfragment("DashboardBuilder.view.templates", this);
				this.getView().addDependent(this.templatesDialog);
				this.templatesDialog.setModel(this.getOwnerComponent().getModel("templates"));
				this.templatesDialog.open();
			}
		},
		// handleData: handles the selection from the "Filters" and "Parameters" selection dialogs, storing the selection as objects, to be inserted into data model AND to be displayed at the "Current Selection" list
		handleData: function() {
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
		// onDelete: in "Build" page, this function handles the items deleted from the "Current Selection" list, rearranging the stored data and the selection list as well
		onDelete: function(oEvent) {
			var oSelectedItem = oEvent.getParameter("listItem");
			var sPath = oSelectedItem.getBindingContext().getPath();
			var iSelectedItemIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1));

			var oList = this.getView().byId("selectedList");
			var oData = this.oModel.getData();
			oData.items.splice(iSelectedItemIndex, 1);
			this.oModel.setData(oData);
			oList.setModel(this.oModel);
		},
		// handleClose: this function is called when selection dialogs (filters and parameters) are closed, uses MessageToast to display the selection to the user
		// then, uses handleDialogs function to clarify if the selection needs another selection dialog (i.e. you select the 'category' filter, the second dialog is the list of categories)
		// or an input dialog (user text input, like in the 'title' parameter)
		handleClose: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function(oContext) {
					return oContext.getObject().name;
				}).join(", "));

				var selectedItem = oEvent.getParameter("selectedItem");

				// MAGIC HERE
				this.itemArray = {};
				this.itemArray.filter = selectedItem.getTitle(); // i.e. Status
				this.itemArray.desc = selectedItem.getDescription(); // i.e. activity_status

				// AND HERE
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
		handleSelectClose: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function(oContext) {
					return oContext.getObject().name;
				}).join(", "));
				var tempArray = aContexts.map(function(oContext) {
					return oContext.getObject().value;
				}).join(",");
				this.itemArray.value = tempArray.split(",");
				this.handleData();
				oEvent.getSource().getBinding("items").filter([]);
			} else {
				MessageToast.show("No new item was selected.");
			}

			this.secDialog.destroy(true);
			delete this.secDialog;
		},
		handleGenerationClose: function(oEvent) {
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
		handleInputClose: function() {
			var input = sap.ui.getCore().byId("userInput").getValue();
			if (input !== "") {
				this.itemArray.value = input.split(",");
				this.handleData();
			}

			this.secDialog.destroy(true);
			delete this.secDialog;
		},
		handleTemplateClose: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				MessageToast.show("You have chosen " + aContexts.map(function(oContext) {
					return oContext.getObject().name;
				}).join(", "));

				var selectedItem = oEvent.getParameter("selectedItem");
				var itemName = selectedItem.getTitle();

				switch (itemName) {
					case "Title":
						var oModel = this.oModel.getData();
						var data = this.getOwnerComponent().getModel("templates");
						var path = selectedItem.getBindingContext().getPath();
						var prop = data.getProperty(path);
						var sPath = prop.options;

						for (var i = 0; i < sPath.length; i++) {
							oModel.items.unshift(sPath[i]);
						}
						this.oModel.setData(oModel);

						this.itemArray = {};
						this.itemArray.filter = "Title";
						this.itemArray.desc = "&title";

						var obj = {};
						obj.info = "input";
						this.handleDialogs(obj);
						break;
					default:
						break;
				}
			} else {
				MessageToast.show("No new item was selected.");
			}
			this.templatesDialog.destroy(true);
			delete this.templatesDialog;
		},
		handleDialogs: function(data) {
			if (!this.secDialog) {
				if (data.info === "Multi Select" || data.info === "Single Select") {
					if (data.info === "Multi Select") {
						this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.select", this);
					} // if multi select
					else {
						this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.options", this);
					} // else it's single select

					var oModel = new sap.ui.model.json.JSONModel();
					var sModel = this.getOwnerComponent().getModel("filters");
					var path = data.path;
					var prop = sModel.getProperty(path);
					var sPath = prop.options;
					oModel.setData(sPath);
					this.secDialog.setModel(oModel);
				} else {
					this.secDialog = sap.ui.xmlfragment("DashboardBuilder.view.input", this);
				}
			}
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this.secDialog);
			this.getView().addDependent(this.secDialog);
			this.secDialog.open();
		}
	});
});