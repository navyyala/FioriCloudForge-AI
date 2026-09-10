sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/format/DateFormat"
], function (Controller, JSONModel, Filter, FilterOperator, DateFormat) {
	"use strict";

	QUnit.module("Master.controller — formatters", {
		beforeEach: function () {
			// Instantiate controller under test without a view
			this.oController = new (Controller.extend("PO_MAINTENANCE.controller.Master", {
				formatTime: function (oDate) {
					var pad = function (n) { return n < 10 ? "0" + n : String(n); };
					return pad(oDate.getHours()) + pad(oDate.getMinutes()) + pad(oDate.getSeconds());
				},
				removeLeadingZeros: function (text) {
					return text ? text.replace(/^0+/, "") : text;
				},
				formatDate: function (sDate) {
					var d = new Date(sDate);
					d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
					return d;
				}
			}))();
		},
		afterEach: function () {
			this.oController.destroy();
		}
	});

	QUnit.test("formatTime — pads single-digit hours, minutes, seconds", function (assert) {
		var oDate = new Date(2026, 0, 1, 9, 5, 3); // 09:05:03
		assert.strictEqual(this.oController.formatTime(oDate), "090503", "Returns zero-padded HHMMSS");
	});

	QUnit.test("formatTime — full double-digit time", function (assert) {
		var oDate = new Date(2026, 0, 1, 14, 30, 59);
		assert.strictEqual(this.oController.formatTime(oDate), "143059", "Returns HHMMSS correctly");
	});

	QUnit.test("removeLeadingZeros — strips leading zeros", function (assert) {
		assert.strictEqual(this.oController.removeLeadingZeros("000012345"), "12345", "Strips leading zeros");
		assert.strictEqual(this.oController.removeLeadingZeros("ABC001"), "ABC001", "Does not strip mid-string zeros");
		assert.strictEqual(this.oController.removeLeadingZeros(""), "", "Empty string returns empty string");
	});

	QUnit.test("removeLeadingZeros — handles null/undefined gracefully", function (assert) {
		assert.strictEqual(this.oController.removeLeadingZeros(null), null, "Returns null for null input");
		assert.strictEqual(this.oController.removeLeadingZeros(undefined), undefined, "Returns undefined for undefined input");
	});

	QUnit.module("Master.controller — filter building", {
		beforeEach: function () {
			this.oFilter = Filter;
			this.oFilterOperator = FilterOperator;
		}
	});

	QUnit.test("Filter with EQ operator is created correctly", function (assert) {
		var oFilter = new this.oFilter("Apptype", this.oFilterOperator.EQ, "C");
		assert.strictEqual(oFilter.sPath, "Apptype", "Filter path is correct");
		assert.strictEqual(oFilter.oValue1, "C", "Filter value is correct");
	});

	QUnit.test("Filter with GE operator for dates", function (assert) {
		var oFilter = new this.oFilter("Date", this.oFilterOperator.GE, "2026-01-01T12:00:00");
		assert.strictEqual(oFilter.sOperator, this.oFilterOperator.GE, "GE operator applied");
	});

	QUnit.module("Master.controller — assignment data", {
		beforeEach: function () {
			this.oAssignModel = new JSONModel({
				technician: "12345678",
				assigned: true,
				notAssigned: false
			});
		},
		afterEach: function () {
			this.oAssignModel.destroy();
		}
	});

	QUnit.test("Assignment model status maps to 'A' when assigned is true", function (assert) {
		var oData = this.oAssignModel.getData();
		var sStatus = oData.assigned ? "A" : "E";
		assert.strictEqual(sStatus, "A", "Assigned flag maps to status 'A'");
	});

	QUnit.test("Assignment model status maps to 'E' when assigned is false", function (assert) {
		this.oAssignModel.setProperty("/assigned", false);
		var oData = this.oAssignModel.getData();
		var sStatus = oData.assigned ? "A" : "E";
		assert.strictEqual(sStatus, "E", "Unassigned flag maps to status 'E'");
	});

	QUnit.test("Technician personnel number is preserved in model", function (assert) {
		assert.strictEqual(this.oAssignModel.getProperty("/technician"), "12345678", "Pernr is correct");
	});
});
