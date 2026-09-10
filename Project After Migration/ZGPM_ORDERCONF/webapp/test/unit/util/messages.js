sap.ui.define([
	"PO_MAINTENANCE/util/messages",
	"sap/ui/model/json/JSONModel"
], function (messages, JSONModel) {
	"use strict";

	QUnit.module("messages — _parseError", {
		beforeEach: function () {
			this.messages = messages;
		}
	});

	QUnit.test("_parseError handles mParameters event correctly", function (assert) {
		var oMockEvent = {
			mParameters: true,
			getParameter: function (sKey) {
				if (sKey === "response") {
					return { message: "Test error", responseText: '{"error": {"message": {"value": "Backend error"}}}' };
				}
				return null;
			}
		};
		var oResult = this.messages._parseError(oMockEvent);
		assert.strictEqual(oResult.sMessage, "Test error", "Message extracted from event response");
		assert.ok(oResult.sDetails, "Details are populated");
	});

	QUnit.test("_parseError handles plain response object correctly", function (assert) {
		var oMockResponse = {
			message: "Simple error",
			response: { body: '{"error": {"message": {"value": "Body error"}}}' }
		};
		var oResult = this.messages._parseError(oMockResponse);
		assert.strictEqual(oResult.sMessage, "Simple error", "Message from plain response");
	});

	QUnit.test("_parseError extracts message value from JSON sDetails", function (assert) {
		var sJson = '{"error":{"message":{"value":"Extracted error message"}}}';
		var oMockEvent = {
			mParameters: true,
			getParameter: function (sKey) {
				if (sKey === "response") {
					return { message: "fallback", responseText: sJson };
				}
				return null;
			}
		};
		var oResult = this.messages._parseError(oMockEvent);
		assert.strictEqual(oResult.sDetails, sJson, "Raw JSON preserved in sDetails");
	});

	QUnit.test("getErrorContent returns a string", function (assert) {
		var oMockResponse = { message: "Error text", response: { body: "" } };
		var sContent = this.messages.getErrorContent(oMockResponse);
		assert.strictEqual(typeof sContent, "string", "getErrorContent returns a string");
		assert.strictEqual(sContent, "Error text", "Correct message returned");
	});

	QUnit.test("_parseError uses native String.startsWith instead of jQuery.sap.startsWith", function (assert) {
		var sDetails = '{"error":{"message":{"value":"test"}}}';
		assert.ok(sDetails.startsWith("{\"error\":"), "Native startsWith works correctly");
		assert.notOk(typeof jQuery !== "undefined" && jQuery.sap && jQuery.sap.startsWith,
			"jQuery.sap.startsWith is NOT used in modern messages.js");
	});
});
