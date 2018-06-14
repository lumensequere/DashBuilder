sap.ui.define([
	"DashboardBuilder/controller/BaseController"
], function(BaseController) {
	"use strict";
	return BaseController.extend("DashboardBuilder.controller.App", {
		onPress: function(oEvent) {
			var target = oEvent.getSource().data("target");
			this.getRouter().navTo(target);
		}
	});
});