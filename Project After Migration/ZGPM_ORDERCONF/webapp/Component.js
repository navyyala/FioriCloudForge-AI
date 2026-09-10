sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"sap/ui/model/json/JSONModel"
], function (UIComponent, Device, JSONModel) {
	"use strict";

	/**
	 * @namespace PO_MAINTENANCE
	 * @class PO_MAINTENANCE.Component
	 * @extends sap.ui.core.UIComponent
	 * Root component for the Corrective Order Confirmation application (ZGPM_ORDERCONF).
	 * Bootstraps models, deferred groups, and the router from manifest.json.
	 */
	return UIComponent.extend("PO_MAINTENANCE.Component", {
		metadata: {
			manifest: "json"
		},

		/**
		 * @override
		 * Initialises device model, OData batch groups, display settings, and the router.
		 */
		init: function () {
			UIComponent.prototype.init.apply(this, arguments);

			this._appType = "C";

			// Device model (read-only)
			var oDeviceModel = new JSONModel({
				isTouch: Device.support.touch,
				isNoTouch: !Device.support.touch,
				isPhone: Device.system.phone,
				isNoPhone: !Device.system.phone,
				listMode: Device.system.phone ? "None" : "SingleSelectMaster",
				listItemType: Device.system.phone ? "Active" : "Inactive",
				system: Device.system
			});
			oDeviceModel.setDefaultBindingMode("OneWay");
			this.setModel(oDeviceModel, "device");

			// Default OData model size limit
			this.getModel().setSizeLimit(1000);

			// Deferred groups for batch-grouped writes
			this.getModel().setDeferredGroups(["editIATF", "OrderList", "OrderItems", "editMaintCounter"]);
			this.getModel().setChangeGroups({
				"IATFCounters":  { groupId: "editIATF" },
				"ORDERLIST":     { groupId: "OrderList" },
				"ORDERITEMS":    { groupId: "OrderItems" },
				"MaintCounters": { groupId: "editMaintCounter" }
			});

			// Attach global request-failed handler
			this.getModel().attachRequestFailed(this._onRequestFailed.bind(this));

			// Load display settings from backend
			this._getDisplaySettings();

			// Initialize router
			this.getRouter().initialize();
		},

		/**
		 * Reads DISPLAY_SETTINGSSet and populates userMode and displaySettings models.
		 * @param {string} oEntry.Field - field name ("manager"|"edit"|any)
		 * @param {string} oEntry.Enable - "X" if enabled
		 * @private
		 */
		_getDisplaySettings: function () {
			var oUserMode        = this.getModel("userMode");
			var oDisplaySettings = this.getModel("displaySettings");

			this.getModel().read("/DISPLAY_SETTINGSSet", {
				success: function (oData) {
					oData.results.forEach(function (oEntry) {
						if (oEntry.Field === "manager") {
							oUserMode.setProperty("/admin", !!oEntry.Enable);
						} else {
							oDisplaySettings.setProperty("/" + oEntry.Field, oEntry);
						}
						if (oEntry.Field === "edit") {
							oUserMode.setProperty("/edit", !!oEntry.Enable);
						}
					});
				}
			});
		},

		/**
		 * Global OData request-failed handler — shows error in MessageBox.
		 * @param {sap.ui.base.Event} oEvent - requestFailed event from ODataModel
		 * @private
		 */
		_onRequestFailed: function (oEvent) {
			sap.ui.require(["sap/m/MessageBox"], function (MessageBox) {
				var oParams = oEvent.getParameters();
				var sMessage = oParams.statusText || oParams.message || "An error occurred.";
				try {
					var oErr = JSON.parse(oParams.responseText);
					if (oErr && oErr.error && oErr.error.message) {
						sMessage = oErr.error.message.value || sMessage;
					}
				} catch (e) { /* not JSON */ }
				MessageBox.error(sMessage);
			});
		}
	});
});
