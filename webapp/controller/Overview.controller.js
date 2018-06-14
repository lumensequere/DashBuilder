sap.ui.define(["DashboardBuilder/controller/BaseController"], function(BaseController) {
	"use strict";
	return BaseController.extend("DashboardBuilder.controller.Overview", {
		/**
		 *@memberOf DashboardBuilder.controller.View1
		 */
		openLinksDialog: function() {
			if (!this.linksDialog) {
				this.linksDialog = sap.ui.xmlfragment("DashboardBuilder.view.links", this);
				this.getView().addDependent(this.linksDialog);
				this.linksDialog.open();
			}
		},
		// when closed, the links dialog gets destroyed
		closeLinksDialog: function() {
			if (this.linksDialog) {
				this.linksDialog.destroy(true);
				delete this.linksDialog;
			}
		}
	});
});