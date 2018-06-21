sap.ui.define([
	"DashboardBuilder/controller/BaseController"
], function(BaseController) {
	"use strict";
	return BaseController.extend("DashboardBuilder.controller.Overview", {
		onPress: function(evt) {
			var oTile = evt.getSource(),
				sTileName = oTile.getTooltip();
			
			switch (sTileName) {
				case "Analyze Guide":
					window.open(""); // carousel guide here
					break;
				case "Build Guide":
					window.open(""); // carousel guide here
					break;
				case "MCC Tools Page":
					window.open("https://jam4.sapjam.com/groups/5LnWdLXIx1B6iNVAa24kiC/overview_page/8fqQOTVX7JN2x1D21tPyZl");
					break;
				case "Main Wiki":
					window.open("https://jam4.sapjam.com/wiki/show/rZ5vCYbqA6bRxCuLUv5Hp4");
					break;
				default:
					break;
			}
		}
	});
});