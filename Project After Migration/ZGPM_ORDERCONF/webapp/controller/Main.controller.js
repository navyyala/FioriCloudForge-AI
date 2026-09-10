sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("PO_MAINTENANCE.view.Main", {
		onInit: function () {
			if (!sap.ui.Device.support.touch) {
				this.getView().addStyleClass("sapUiSizeCompact");
			}
		}
	});
});
