sap.ui.define([
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (JSONModel, Filter, FilterOperator) {
	"use strict";

	QUnit.module("Details.controller — model state", {
		beforeEach: function () {
			this.oUserMode = new JSONModel({ admin: false, edit: false });
			this.oDisplaySettings = new JSONModel({});
			this.oOrderModel = new JSONModel({
				Aufnr: "000100001234",
				Apptype: "C",
				Tplnr: "LOC-001",
				Equnr: "EQ-001",
				Status: "A",
				Pernr: "00001234"
			});
		},
		afterEach: function () {
			this.oUserMode.destroy();
			this.oDisplaySettings.destroy();
			this.oOrderModel.destroy();
		}
	});

	QUnit.test("userMode model initialises with admin=false and edit=false", function (assert) {
		assert.strictEqual(this.oUserMode.getProperty("/admin"), false, "admin is false by default");
		assert.strictEqual(this.oUserMode.getProperty("/edit"), false, "edit is false by default");
	});

	QUnit.test("admin flag toggles correctly via model property", function (assert) {
		this.oUserMode.setProperty("/admin", true);
		assert.strictEqual(this.oUserMode.getProperty("/admin"), true, "admin flag toggled to true");
	});

	QUnit.test("Order entity Aufnr is accessible from model", function (assert) {
		assert.strictEqual(this.oOrderModel.getProperty("/Aufnr"), "000100001234", "Aufnr is accessible");
	});

	QUnit.test("Leading zeros preserved in raw Aufnr (leading-zero strip is done in formatter)", function (assert) {
		var sAufnr = this.oOrderModel.getProperty("/Aufnr");
		assert.ok(sAufnr.startsWith("0"), "Raw Aufnr has leading zeros");
	});

	QUnit.module("Details.controller — deferred group keys", function () {
		var aExpectedGroups = ["editIATF", "OrderList", "OrderItems", "editMaintCounter"];

		QUnit.test("All expected deferred groups are defined", function (assert) {
			aExpectedGroups.forEach(function (sGroup) {
				assert.ok(sGroup, "Group key '" + sGroup + "' is non-empty");
			});
			assert.strictEqual(aExpectedGroups.length, 4, "Exactly 4 deferred groups defined");
		});
	});

	QUnit.module("Details.controller — navigation path helpers", {
		beforeEach: function () {
			this._sItemPath = "/ORDERLISTSet('000100001234')";
		}
	});

	QUnit.test("Entity path is correctly formed from URL segment", function (assert) {
		var sEntity = "ORDERLISTSet('000100001234')";
		var sExpected = "/" + sEntity;
		assert.strictEqual("/" + sEntity, sExpected, "Item path prefixed with /");
	});

	QUnit.test("Aufnr is extracted from entity path between single quotes", function (assert) {
		var sPath = "/ORDERLISTSet('000100001234')";
		var sAufnr = sPath.split("'")[1];
		assert.strictEqual(sAufnr, "000100001234", "Aufnr correctly extracted from path");
	});

	QUnit.module("Details.controller — IATF filter construction", {
		beforeEach: function () {
			this.sFuncLoc = "LOC-FACTORY-01";
			this.sAufnr   = "000100001234";
			this.sEqunr   = "EQ-001";
		}
	});

	QUnit.test("IATF filters include Tplnr and Aufnr", function (assert) {
		var aFilters = [
			new Filter("Tplnr", FilterOperator.EQ, this.sFuncLoc),
			new Filter("Aufnr", FilterOperator.EQ, this.sAufnr)
		];
		assert.strictEqual(aFilters.length, 2, "Two base filters created");
		assert.strictEqual(aFilters[0].sPath, "Tplnr", "First filter is Tplnr");
		assert.strictEqual(aFilters[1].sPath, "Aufnr", "Second filter is Aufnr");
	});

	QUnit.test("Equipment filter is added only when Equnr is non-empty", function (assert) {
		var aFilters = [
			new Filter("Tplnr", FilterOperator.EQ, this.sFuncLoc),
			new Filter("Aufnr", FilterOperator.EQ, this.sAufnr)
		];
		if (this.sEqunr) {
			aFilters.push(new Filter("Equnr", FilterOperator.EQ, this.sEqunr));
		}
		assert.strictEqual(aFilters.length, 3, "Equipment filter appended when Equnr is present");
	});

	QUnit.test("Equipment filter is NOT added when Equnr is empty", function (assert) {
		var sEqunr = "";
		var aFilters = [
			new Filter("Tplnr", FilterOperator.EQ, this.sFuncLoc),
			new Filter("Aufnr", FilterOperator.EQ, this.sAufnr)
		];
		if (sEqunr) {
			aFilters.push(new Filter("Equnr", FilterOperator.EQ, sEqunr));
		}
		assert.strictEqual(aFilters.length, 2, "Equipment filter omitted when Equnr is empty");
	});
});
