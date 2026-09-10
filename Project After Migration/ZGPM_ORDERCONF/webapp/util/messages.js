sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageView",
	"sap/m/MessageItem",
	"sap/m/Dialog",
	"sap/m/Button",
	"sap/m/Bar",
	"sap/m/Text",
	"sap/ui/Device"
], function (JSONModel, MessageBox, MessageView, MessageItem, Dialog, Button, Bar, Text, Device) {
	"use strict";

	var messages = {};

	/**
	 * Shows an error dialog from an OData response.
	 * @param {object} oParameter - OData error response or event
	 * @param {object} context - caller context (unused, kept for API compatibility)
	 */
	messages.showErrorMessage = function (oParameter, context) {
		var oErrorDetails = messages._parseError(oParameter);
		var self = this;

		var oError;
		try {
			oError = JSON.parse(oErrorDetails.sDetails);
		} catch (e) {
			MessageBox.error(oErrorDetails.sMessage);
			return;
		}

		if (!this.messageModel) {
			this.messageModel = new JSONModel([]);
		}

		var aErrorDetails = oError && oError.error && oError.error.innererror && oError.error.innererror.errordetails;
		if (aErrorDetails && aErrorDetails.length > 0) {
			this.messageModel.getData().push({
				type:        "Error",
				message:     aErrorDetails[0].message,
				description: oErrorDetails.sDetails
			});

			if (!this.oDialog) {
				var oMessageTemplate = new MessageItem({
					type:        "{type}",
					title:       "{message}",
					description: "{description}"
				});
				this.oMessageView = new MessageView({
					items: { path: "/", template: oMessageTemplate }
				});
				this.oMessageView.setModel(this.messageModel);

				var oBackButton = new Button({
					icon:    "sap-icon://nav-back",
					visible: false,
					press:   function () {
						self.oMessageView.navigateBack();
						this.setVisible(false);
					}
				});
				this.oDialog = new Dialog({
					resizable:     true,
					content:       this.oMessageView,
					state:         "Error",
					contentHeight: "300px",
					contentWidth:  "500px",
					verticalScrolling: false,
					customHeader:  new Bar({
						contentMiddle: [new Text({ text: "Error" })],
						contentLeft:   [oBackButton]
					}),
					beginButton: new Button({
						text:  "Close",
						press: function () {
							this.getParent().close();
							self.messageModel.setData([]);
						}
					})
				});
				if (!Device.support.touch) {
					this.oDialog.addStyleClass("sapUiSizeCompact");
				}
			}
			this.messageModel.refresh();
			this.oDialog.open();
		} else {
			MessageBox.error(oErrorDetails.sMessage, {
				details: oErrorDetails.sDetails
			});
		}
	};

	/**
	 * Returns the human-readable error message string from an OData error response.
	 * @param {object} oParameter
	 * @returns {string}
	 */
	messages.getErrorContent = function (oParameter) {
		return messages._parseError(oParameter).sMessage;
	};

	/**
	 * Parses an OData error response into message and details strings.
	 * @param {object} oParameter
	 * @returns {{ sMessage: string, sDetails: string }}
	 * @private
	 */
	messages._parseError = function (oParameter) {
		var sMessage = "";
		var sDetails = "";

		if (oParameter.mParameters) {
			var oResponse = oParameter.getParameter("response");
			if (oResponse) {
				sMessage = oResponse.message;
				sDetails = oResponse.responseText;
			} else {
				sMessage = oParameter.getParameter("message");
				sDetails = oParameter.getParameter("responseText");
			}
		} else {
			sMessage = oParameter.message;
			sDetails = oParameter.response ? oParameter.response.body : "";
		}

		if (typeof sDetails === "string" && sDetails.startsWith("{\"error\":")) {
			try {
				var oErrModel = new JSONModel();
				oErrModel.setJSON(sDetails);
				sMessage = oErrModel.getProperty("/error/message/value") || sMessage;
			} catch (e) { /* parse failed, keep sMessage */ }
		}

		return { sDetails: sDetails, sMessage: sMessage };
	};

	return messages;
});
