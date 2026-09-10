sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/core/Fragment",
	"sap/m/MessageToast",
	"sap/ui/core/format/DateFormat",
	"sap/ui/model/json/JSONModel"
], function (Controller, Filter, FilterOperator, Sorter, Fragment, MessageToast, DateFormat, JSONModel) {
	"use strict";

	/**
	 * @namespace PO_MAINTENANCE.controller
	 * @class PO_MAINTENANCE.controller.Master
	 * @extends sap.ui.core.mvc.Controller
	 * Master list controller for the Corrective/Preventive Order list page.
	 * Handles order filtering, sorting, barcode scanning, assignment, and print.
	 */
	return Controller.extend("PO_MAINTENANCE.view.Master", {

		_oCatalog: null,
		_oResourceBundle: null,

		/**
		 * @override
		 * Initialises router, component reference, view model, and startup parameters.
		 */
		onInit: function () {
			this._oView = this.getView();
			this._oComponent = this.getOwnerComponent();
			this._oResourceBundle = this._oComponent.getModel("i18n").getResourceBundle();
			this._oRouter = this._oComponent.getRouter();
			this._oCatalog = this._oView.byId("catalogTable");
			this._frgIdAssignmentTechnique = this._oView.getId() + "-assignment";
			this._frgIdPosteTechnique      = this._oView.getId() + "-posteTechniqueFrg";
			this._frgIdEquipement          = this._oView.getId() + "-equipementFrg";
			this._frgIdArticle             = this._oView.getId() + "-article";

			this._oRouter.getRoute("main").attachPatternMatched(this.onRouteMatched, this);

			this._appType  = "C";
			this._orderType = "";

			// Set shell title
			var oShellTitle = sap.ui.getCore().byId("shellAppTitle");
			if (oShellTitle) {
				oShellTitle.setText(this._oResourceBundle.getText("singleMasterTitle"));
			}
			this._oView.byId("orderListPage").setTitle(this._oResourceBundle.getText("singleMasterTitle"));
			this._oView.byId("col_workSche").setVisible(false);
			this._oView.byId("col_tempsPrevu").setVisible(false);

			var oStartup = this._oComponent.getComponentData();
			if (oStartup && oStartup.startupParameters && oStartup.startupParameters.apptype) {
				this._appType = oStartup.startupParameters.apptype[0];
				if (oStartup.startupParameters.ordertype) {
					this._orderType = oStartup.startupParameters.ordertype[0];
				}
				if (this._appType === "P") {
					this._oView.byId("orderListPage").setTitle(this._oResourceBundle.getText("orderListPageTitle"));
					this._oView.byId("col_workSche").setVisible(true);
					this._oView.byId("col_tempsPrevu").setVisible(true);
					this._oView.byId("vBoxCatFailure").setVisible(false);
					this._oView.byId("vBoxFailureCode").setVisible(false);
					this._oView.byId("vBoxDateDebCorr").setVisible(false);
					this._oView.byId("vBoxDateDebPrev").setVisible(true);
				}
			}

			this._oComponent._appType = this._appType;
			this._initViewPropertiesModel();
			this.initFilters();

			var oHomeBtn = sap.ui.getCore().byId("homeBtn");
			if (oHomeBtn) {
				oHomeBtn.setVisible(false);
			}
		},

		onAfterRendering: function () {
			var appFilters = [];
			var sTitle;

			if (this._oResourceBundle.getText("orderListPageTitle" + this._orderType)) {
				sTitle = this._oResourceBundle.getText("orderListPageTitle" + this._orderType) + " - " + this._orderType;
			} else {
				sTitle = this._oResourceBundle.getText("orderListPageTitle") + " - " + this._orderType;
			}
			this._oView.byId("orderListPage").setTitle(sTitle);

			if (this._appType === "P") {
				appFilters.push(new Filter("Apptype", FilterOperator.EQ, this._appType));
				appFilters.push(new Filter("Aufart", FilterOperator.EQ, this._orderType));
				this._oCatalog.getBinding("items").filter(appFilters);
			}
			if (this._appType === "C") {
				appFilters.push(new Filter("Apptype", FilterOperator.EQ, this._appType));
				if (this._orderType) {
					appFilters.push(new Filter("Aufart", FilterOperator.EQ, this._orderType));
				}
				this._oCatalog.getBinding("items").filter(appFilters);
			}
		},

		onRouteMatched: function () {
			this.getView().byId("catalogTable").getBinding("items").refresh(true);
			var oStartup = this._oComponent.getComponentData();
			if (oStartup && oStartup.startupParameters && oStartup.startupParameters.orderID) {
				var sOrderId  = oStartup.startupParameters.orderID;
				var sTechId   = oStartup.startupParameters.technician
					? (oStartup.startupParameters.technician[0] || oStartup.startupParameters.technician)
					: "";
				this._oComponent.getModel("external").setProperty("/from", "createOrder");
				this._oComponent.getModel("external").setProperty("/technician", sTechId);
				this._oRouter.navTo("details", {
					from: "mainExt",
					entity: "ORDERLISTSet('" + sOrderId + "')"
				});
			}
		},

		_initViewPropertiesModel: function () {
			var oViewElemProperties = { catalogTitleText: "" };
			if (sap.ui.Device.system.phone) {
				oViewElemProperties.availabilityColumnWidth  = "80%";
				oViewElemProperties.pictureColumnWidth       = "5rem";
				oViewElemProperties.btnColHeaderVisible      = true;
				oViewElemProperties.searchFieldWidth         = "100%";
				oViewElemProperties.catalogTitleVisible      = false;
				this.byId("tableToolbar").removeContent(this.byId("toolbarSpacer"));
			} else {
				oViewElemProperties.availabilityColumnWidth  = "18%";
				oViewElemProperties.pictureColumnWidth       = "9%";
				oViewElemProperties.btnColHeaderVisible      = false;
				oViewElemProperties.searchFieldWidth         = "30%";
				oViewElemProperties.catalogTitleVisible      = true;
				oViewElemProperties.smallWidth               = "8%";
				oViewElemProperties.normalWidth              = "12%";
				oViewElemProperties.largeWidth               = "18%";
			}
			this._oViewProperties = new JSONModel(oViewElemProperties);
			this._oView.setModel(this._oViewProperties, "viewProperties");
		},

		onNavBack: function () {
			var oCrossAppNavigator = sap.ushell && sap.ushell.Container
				? sap.ushell.Container.getService("CrossApplicationNavigation")
				: null;
			if (oCrossAppNavigator) {
				oCrossAppNavigator.toExternal({ target: { semanticObject: "#" } });
			} else {
				window.history.go(-1);
			}
		},

		/*** Search & Filter ***/

		onSearchPressed: function () {
			this.onGoPressed();
		},

		sorterPopup: null,

		handleSortButtonPressed: function () {
			var self = this;
			Fragment.load({
				name: "PO_MAINTENANCE.view.fragment.DateSorter",
				type: "XML",
				controller: this
			}).then(function (oDateSorter) {
				self.sorterPopup = oDateSorter;
				self.sorterPopup.open();
			});
		},

		onConfirm: function (oEvent) {
			var sortItem  = oEvent.getParameter("sortItem");
			var sortDesc  = oEvent.getParameter("sortDescending");
			var oBinding  = this.getView().byId("catalogTable").getBinding("items");
			oBinding.sort(new Sorter(sortItem.getKey(), sortDesc));
			this.sorterPopup.destroy();
		},

		onSorterCancel: function () {
			this.sorterPopup.destroy();
		},

		onLineItemPressed: function (oEvent) {
			this._oRouter.navTo("details", {
				from: "main",
				entity: oEvent.getSource().getBindingContext().getPath().substr(1)
			});
		},

		/**
		 * Applies active filter set to the order table.
		 * Reads all filter UI controls and builds a Filter array.
		 */
		onGoPressed: function () {
			var oView = this.getView();
			var filter = [];
			var dateFormat = DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-ddTHH:mm:ss" });

			var documentDateFrom = (this._appType === "P")
				? oView.byId("filtre_documentDateDebPrev")
				: oView.byId("filtre_documentDateDeb");
			var documentDateTo = oView.byId("filtre_documentDateFin");

			// Priority
			var selPriorite = oView.byId("filtre_priorite");
			if (selPriorite && selPriorite.getSelectedItem()) {
				filter.push(new Filter("Priok", FilterOperator.Contains, selPriorite.getSelectedKey()));
			}
			// Work center
			var selWorkcenter = oView.byId("filtre_wCenter");
			if (selWorkcenter && selWorkcenter.getSelectedItem()) {
				filter.push(new Filter("Gewrk", FilterOperator.Contains, selWorkcenter.getSelectedKey()));
			}
			// Sender (free-text input)
			var selEmeteur = oView.byId("filtre_emeteur");
			if (selEmeteur && selEmeteur.getValue()) {
				filter.push(new Filter("Qmnam", FilterOperator.Contains, selEmeteur.getValue()));
			}
			// Technician
			var selIntervenant = oView.byId("filtre_intervenant");
			if (selIntervenant && selIntervenant.getSelectedItem()) {
				filter.push(new Filter("Pernr", FilterOperator.Contains, selIntervenant.getSelectedKey()));
			}
			// Functional location / equipment / material (from VH dialogs)
			if (this._filterPosteName) {
				filter.push(new Filter("Tplnr", FilterOperator.Contains, this._filterPosteName));
			}
			if (this._filterEquipementName) {
				filter.push(new Filter("Equnr", FilterOperator.Contains, this._filterEquipementName));
			}
			if (this._filterArticleName) {
				filter.push(new Filter("Matnr", FilterOperator.Contains, this._filterArticleName));
			}
			// Failure catalog + code
			var selFailureCat  = oView.byId("filtre_EchecCatalogue");
			var selFailureCode = oView.byId("filtre_codeEchec");
			if (selFailureCat && selFailureCat.getSelectedItem()) {
				filter.push(new Filter("Fegrp", FilterOperator.Contains, selFailureCat.getSelectedKey()));
			}
			if (selFailureCode && selFailureCode.getSelectedItem()) {
				filter.push(new Filter("Fecod", FilterOperator.Contains, selFailureCode.getSelectedKey()));
			}
			// Function catalog + code
			var selFunction     = oView.byId("cb_CatFunc");
			var selFunctionCode = oView.byId("cb_FunCode");
			if (selFunction && selFunction.getSelectedItem()) {
				filter.push(new Filter("Otgrp", FilterOperator.Contains, selFunction.getSelectedKey()));
			}
			if (selFunctionCode && selFunctionCode.getSelectedItem()) {
				filter.push(new Filter("Oteil", FilterOperator.Contains, selFunctionCode.getSelectedKey()));
			}
			// Cause catalog + code
			var selCause     = oView.byId("cb_CatCause");
			var selCauseCode = oView.byId("cb_CauseCode");
			if (selCause && selCause.getSelectedItem()) {
				filter.push(new Filter("Urgrp", FilterOperator.Contains, selCause.getSelectedKey()));
			}
			if (selCauseCode && selCauseCode.getSelectedItem()) {
				filter.push(new Filter("Urcod", FilterOperator.Contains, selCauseCode.getSelectedKey()));
			}
			// Date from
			if (documentDateFrom && documentDateFrom.getDateValue()) {
				var begda = new Date(documentDateFrom.getDateValue());
				begda.setHours(12);
				filter.push(new Filter("Date", FilterOperator.GE, dateFormat.format(begda)));
			}
			// Date to
			if (documentDateTo && documentDateTo.getDateValue()) {
				var endda = new Date(documentDateTo.getDateValue());
				endda.setHours(12);
				filter.push(new Filter("Date", FilterOperator.LE, dateFormat.format(endda)));
			}
			// Date range validation
			if (documentDateFrom && documentDateTo &&
				documentDateFrom.getDateValue() && documentDateTo.getDateValue() &&
				documentDateFrom.getDateValue() > documentDateTo.getDateValue()) {
				MessageToast.show("Fill the right period");
				return;
			}
			// Free-text search
			var sValue = this.byId("searchField").getValue();
			if (sValue) {
				filter.push(new Filter("Ktext", FilterOperator.Contains, "*" + sValue));
			}
			// Order type
			if (this._orderType) {
				filter.push(new Filter("Aufart", FilterOperator.EQ, this._orderType));
			}
			this._oCatalog.getBinding("items").filter(filter);
		},

		/*** Value Helps ***/

		/**
		 * Opens the Functional Location value help dialog.
		 * Creates fragment lazily on first call.
		 */
		onPosteTechniqueValueHelpRequest: function () {
			if (!this._oPosteTechniqueDialog) {
				this._oPosteTechniqueDialog = sap.ui.xmlfragment(
					this._frgIdPosteTechnique,
					"PO_MAINTENANCE.view.fragment.FunctionalLocationValueHelp",
					this
				);
				this._oView.addDependent(this._oPosteTechniqueDialog);
				this._oPosteTechniqueDialog.setModel(this.getView().getModel());
				this._oPosteTechniqueDialog.setModel(this.getView().getModel("i18n"), "i18n");
			}
			this._oPosteTechniqueDialog.open();
		},

		onEquipementValueHelpRequest: function () {
			if (!this._oEquipementDialog) {
				this._oEquipementDialog = sap.ui.xmlfragment(
					this._frgIdEquipement,
					"PO_MAINTENANCE.view.fragment.EquipmentDialog",
					this
				);
				this._oEquipementDialog.attachSearch(this.handleEquipementDialogSearch, this);
				this._oEquipementDialog.setModel(this.getView().getModel());
				this._oEquipementDialog.setModel(this.getView().getModel("i18n"), "i18n");
			}
			var filters = [
				new Filter("Apptype", FilterOperator.EQ, this._appType),
				new Filter("ObjectType", FilterOperator.EQ, "E")
			];
			if (this._filterPosteName) {
				filters.push(new Filter("Tplnr", FilterOperator.EQ, this._filterPosteName));
			}
			this._oEquipementDialog.getBinding("items").filter(filters);
			this._oEquipementDialog.open();
		},

		handleEquipementDialogSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [
				new Filter("Apptype", FilterOperator.EQ, this._appType),
				new Filter("ObjectType", FilterOperator.EQ, "E"),
				new Filter("Description", FilterOperator.EQ, sValue),
				new Filter("Equnr", FilterOperator.EQ, sValue)
			];
			if (this._filterPosteName) {
				aFilters.push(new Filter("Tplnr", FilterOperator.EQ, this._filterPosteName));
			}
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		handleEquipementDialogClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts.length) {
				var oChosen = aContexts[0].getObject();
				this.getView().byId("filtre_equipement").setValue(oChosen.Description);
				this._filterEquipementName = oChosen.Equnr;
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		handlePosteTechniqueDialogSearch: function (oEvent) {
			var sValue   = oEvent.getParameter("value");
			var aFilters = [
				new Filter("Apptype", FilterOperator.EQ, this._appType),
				new Filter("ObjectType", FilterOperator.EQ, "F"),
				new Filter("Tplnr", FilterOperator.EQ, sValue)
			];
			oEvent.getSource().getBinding("items").filter(aFilters);
		},

		handlePosteTechniqueDialogClose: function (oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts.length) {
				var oChosen = aContexts[0].getObject();
				this.getView().byId("filtre_posteTechnique").setValue(oChosen.Description);
				this._filterPosteName = oChosen.Tplnr;
			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		onArticleValueHelpRequest: function () {
			if (!this._oArticleDialog) {
				this._oArticleDialog = sap.ui.xmlfragment(
					this._frgIdArticle,
					"PO_MAINTENANCE.view.fragment.ArticleDialog",
					this
				);
				this._oArticleDialog.setModel(this.getView().getModel());
				this._oArticleDialog.setModel(this.getView().getModel("i18n"), "i18n");
			}
			this._oArticleDialog.open();
		},

		resetSearch: function () {
			var sId = this._frgIdArticle;
			Fragment.byId(sId, "table").getBinding("items").filter([]);
			["material", "materialDesc", "manfPart", "manf", "oldPartNum"].forEach(function (sCtrl) {
				Fragment.byId(sId, sCtrl).setValue("");
			});
		},

		performSearch: function () {
			var sId    = this._frgIdArticle;
			var fields = { material: "Matnr", materialDesc: "Maktx", manfPart: "ZMfrpn", manf: "ZMfrnr", oldPartNum: "ZzOldMatnr" };
			var filters = [];
			Object.keys(fields).forEach(function (sCtrl) {
				var sVal = Fragment.byId(sId, sCtrl).getValue();
				if (sVal) { filters.push(new Filter(fields[sCtrl], FilterOperator.EQ, sVal)); }
			});
			Fragment.byId(sId, "table").getBinding("items").filter(filters);
		},

		onMaterialPress: function (oEvent) {
			var oData = this.getView().getModel().getProperty(oEvent.getSource().getBindingContext().getPath());
			this._filterArticleName = oData.Matnr.replace(/^0+/, "");
			this.getView().byId("filtre_rechange").setValue(oData.Maktx);
			this.closeArticleDialog();
		},

		closeArticleDialog: function () {
			this._oArticleDialog.close();
		},

		/*** Filter Initialization & Reset ***/

		initFilters: function () {
			this.getView().byId("filtre_EchecCatalogue").setSelectedKey();
			this.getView().byId("filtre_codeEchec").setSelectedKey();
			this.getView().byId("filtre_priorite").setSelectedKey();
			this.getView().byId("filtre_wCenter").setSelectedKey();
			this.getView().byId("filtre_emeteur").setValue();
			this.getView().byId("filtre_intervenant").setSelectedKey();
			this.getView().byId("filtre_posteTechnique").setValue();
			this.getView().byId("filtre_equipement").setValue();
			this._filterPosteName      = "";
			this._filterEquipementName = "";
		},

		onResetPressed: function () {
			var oView = this.getView();
			this._currTplnr = "";
			var dateDeb = new Date();
			dateDeb.setMonth(dateDeb.getMonth() - 12);
			var dateFin = new Date();

			if (this._appType === "P") {
				oView.byId("filtre_documentDateDebPrev").setDateValue(dateDeb);
			} else {
				oView.byId("filtre_documentDateDeb").setDateValue(dateDeb);
				oView.byId("filtre_EchecCatalogue").setSelectedKey();
				oView.byId("filtre_codeEchec").setSelectedKey();
			}
			oView.byId("filtre_documentDateFin").setDateValue(dateFin);
			["filtre_priorite", "cb_CatFunc", "cb_FunCode", "cb_CatCause", "cb_CauseCode",
				"filtre_wCenter", "filtre_intervenant"].forEach(function (sId) {
				oView.byId(sId).setSelectedKey();
			});
			oView.byId("filtre_emeteur").setValue();
			oView.byId("filtre_posteTechnique").setValue();
			oView.byId("filtre_equipement").setValue();
			oView.byId("searchField").setValue();
			this._filterPosteName      = "";
			this._filterEquipementName = "";
			this._filterArticleName    = "";

			var filter = [];
			if (this._appType) {
				filter.push(new Filter("Apptype", FilterOperator.Contains, this._appType));
			}
			if (this._orderType) {
				filter.push(new Filter("Aufart", FilterOperator.EQ, this._orderType));
			}
			this._oCatalog.getBinding("items").filter(filter);
		},

		/*** Assignment Dialog ***/

		/**
		 * Opens the Assignment dialog for selected orders.
		 * Shows a toast if no orders are selected.
		 */
		onAssignedBtnPressed: function () {
			var aContexts = this._oCatalog.getSelectedContexts();
			if (aContexts.length <= 0) {
				MessageToast.show(this._oResourceBundle.getText("noSelectionMsg"));
				return;
			}
			if (!this._oAssignmentDialog) {
				this._oAssignmentDialog = sap.ui.xmlfragment(
					this._frgIdAssignmentTechnique,
					"PO_MAINTENANCE.view.fragment.AssignmentDialog",
					this
				);
				this._oAssignmentDialog.setModel(this.getView().getModel());
				this._oAssignmentDialog.setModel(this.getView().getModel("i18n"), "i18n");
				this._oAssignmentDialog.setModel(this.getView().getModel("assignment"), "assignment");
			}
			this._oAssignmentDialog.open();
		},

		/**
		 * Submits assignment data to ASSIGNMENTSet and refreshes the list on success.
		 */
		executeAssignment: function () {
			var oAssignData = this.getView().getModel("assignment").getData();
			var sTechnician = oAssignData.technician;
			var sAssigned   = oAssignData.assigned ? "A" : "E";
			var aContexts   = this._oCatalog.getSelectedContexts();
			var aTakeover   = [];
			var self        = this;

			aContexts.forEach(function (oCtx) {
				var oObject = oCtx.getObject();
				var date    = new Date();
				aTakeover.push({
					Aufnr: oObject.Aufnr,
					Pernr: sTechnician,
					Date:  date,
					Time:  self.formatTime(date)
				});
			});

			this._oComponent.getModel().create("/ASSIGNMENTSet", {
				Status:   sAssigned,
				Pernr:    sTechnician,
				TAKEOVER: aTakeover
			}, {
				success: function () { self.onGoPressed(); self.closeDialog(); },
				error:   function () { MessageToast.show("Prise en charge non affectée"); self.closeDialog(); }
			});
		},

		closeDialog: function () {
			this._oAssignmentDialog.close();
		},

		/*** Print ***/

		onPrintBtnPressed: function () {
			if (this._oCatalog.getSelectedContexts().length <= 0) {
				MessageToast.show(this._oResourceBundle.getText("noSelectionMsg"));
				return;
			}
			this.executePrint(0);
		},

		/**
		 * Opens a print window for each selected order in sequence (1-second delay between each).
		 * @param {number} index - current position in the selected contexts array
		 */
		executePrint: function (index) {
			var aContexts = this._oCatalog.getSelectedContexts();
			var self      = this;
			if (index < aContexts.length) {
				var oContext = aContexts[index];
				var oObject  = oContext.getObject();
				var sPath    = oContext.getPath();

				window.open(window.location.origin + this._oComponent.getModel().sServiceUrl +
					"/PRINT_FORMSet('" + oObject.Aufnr + "')/$value");

				if (oObject.PrintStatus === "P") { oObject.PrintStatus = "R"; }
				else if (!oObject.PrintStatus)   { oObject.PrintStatus = "P"; }

				this._oComponent.getModel().setProperty(sPath, oObject);
				this._oComponent.getModel().updateBindings(true);

				setTimeout(function () { self.executePrint(index + 1); }, 1000);
			}
		},

		/*** Combo-box cascade handlers ***/

		handleFailureCatChange: function (oEvent) {
			var oView = this.getView();
			oView.byId("filtre_codeEchec").setEnabled(true);
			oView.byId("filtre_codeEchec").setSelectedItem(null);
			var selectedKey = oEvent.getParameter("selectedItem").getKey();
			oView.byId("filtre_codeEchec").getBinding("items").filter([
				new Filter("Codegruppe", FilterOperator.EQ, selectedKey)
			]);
		},

		handleWorkCenterChange: function (oEvent) {
			var oView       = this.getView();
			var selectedKey = oEvent.getParameter("selectedItem").getKey();
			oView.byId("filtre_intervenant").setEnabled(true);
			oView.byId("filtre_emeteur").setEnabled(true);
			oView.byId("filtre_intervenant").setSelectedItem(null);
			oView.byId("filtre_emeteur").setValue();
			oView.byId("filtre_intervenant").getBinding("items").filter([
				new Filter("Arbpl", FilterOperator.EQ, selectedKey)
			]);
		},

		onFunctionCatChange: function (oEvent) {
			var oView       = this.getView();
			var selectedKey = oEvent.getParameter("selectedItem").getKey();
			oView.byId("cb_FunCode").setEnabled(true);
			oView.byId("cb_FunCode").setSelectedItem(null);
			oView.byId("cb_FunCode").getBinding("items").filter([
				new Filter("Codegruppe", FilterOperator.EQ, selectedKey)
			]);
		},

		onCauseCatChange: function (oEvent) {
			var oView       = this.getView();
			var selectedKey = oEvent.getParameter("selectedItem").getKey();
			oView.byId("cb_CauseCode").setEnabled(true);
			oView.byId("cb_CauseCode").setSelectedItem(null);
			oView.byId("cb_CauseCode").getBinding("items").filter([
				new Filter("Codegruppe", FilterOperator.EQ, selectedKey)
			]);
		},

		/*** Barcode scan ***/

		onScanCreate: function () {
			var self = this;
			sap.ui.require(["sap/ndc/BarcodeScanner"], function (BarcodeScanner) {
				BarcodeScanner.scan(
					function (mResult) {
						if (!mResult.cancelled && mResult.text) {
							self.getView().byId("filtre_posteTechnique").setValue(mResult.text);
							self._filterPosteName = mResult.text;
							self.onGoPressed();
						}
					},
					function () {
						MessageToast.show(self._oResourceBundle.getText("scanFailed"));
					}
				);
			});
		},

		/*** Functional location VH handlers ***/

		onSelect: function () {
			var list    = Fragment.byId(this._frgIdPosteTechnique, "list");
			var listNav = Fragment.byId(this._frgIdPosteTechnique, "listNav");
			listNav.removeSelections(true);
			var selectedItem  = list.getSelectedItem();
			var nameSelected  = selectedItem.getBindingContext().toString().split("'")[1];
			var objTypeSelected = selectedItem.data("objType") || "F";

			this._tmpObjTypeSelected = objTypeSelected;
			window._logo = selectedItem.data("base64"); //eslint-disable-line sap-no-global-define

			var filters = [];
			if (nameSelected) {
				filters.push(new Filter("Name", FilterOperator.Contains, nameSelected));
				filters.push(new Filter("ObjType", FilterOperator.EQ, objTypeSelected));
				list.getBinding("items").filter(filters);
				listNav.getBinding("items").filter(filters);
			}
			this._filterPosteName = nameSelected;
		},

		onSelectNav: function () {
			var list         = Fragment.byId(this._frgIdPosteTechnique, "list");
			var listNav      = Fragment.byId(this._frgIdPosteTechnique, "listNav");
			list.removeSelections(true);
			var selectedItem = listNav.getSelectedItem();
			var nameSelected = selectedItem.data("name");
			window._logo = selectedItem.data("base64"); //eslint-disable-line sap-no-global-define

			var filters = [];
			if (nameSelected) {
				filters.push(new Filter("Name", FilterOperator.Contains, nameSelected));
				filters.push(new Filter("ObjType", FilterOperator.Contains, this._tmpObjTypeSelected));
				list.getBinding("items").filter(filters);
				listNav.getBinding("items").filter(filters);
			}
			window._postDescription  = selectedItem.getTitle(); //eslint-disable-line sap-no-global-define
			window._equipeDescription = ""; //eslint-disable-line sap-no-global-define
		},

		onFuncUpdated: function (oEvent) {
			var oList     = oEvent.getSource();
			var listColor = [];
			oList.getItems().forEach(function (oItem, i) {
				oItem.addStyleClass(oItem.data("color"));
				listColor[i] = oItem.data("color");
			});
			this.getView().setModel(new JSONModel(listColor), "modelColor");
		},

		onFuncLocValueHelpOK: function () {
			this.getView().byId("filtre_posteTechnique").setValue(this._filterPosteName);
			Fragment.byId(this._frgIdPosteTechnique, "searchField").setValue("");
			this._oPosteTechniqueDialog.close();
			this.onGoPressed();
		},

		onFuncLocValueHelpClose: function () {
			Fragment.byId(this._frgIdPosteTechnique, "searchField").setValue("");
			this._oPosteTechniqueDialog.close();
		},

		onFuncLocRefreshList: function () {
			Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter([]);
			Fragment.byId(this._frgIdPosteTechnique, "list").setSelectedItem(null);
			Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter([]);
		},

		onFuncLocSearch: function () {
			var searchString = Fragment.byId(this._frgIdPosteTechnique, "searchField").getValue();
			var filters = searchString
				? [new Filter("Description", FilterOperator.Contains, searchString)]
				: [];
			Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter(filters);
		},

		/*** Formatters (kept for view bindings) ***/

		/**
		 * Formats a Date object to HHMMSS string for OData Time fields.
		 * @param {Date} oDate - date to format
		 * @returns {string} zero-padded time string
		 */
		formatTime: function (oDate) {
			var pad = function (n) { return n < 10 ? "0" + n : String(n); };
			return pad(oDate.getHours()) + pad(oDate.getMinutes()) + pad(oDate.getSeconds());
		},

		formatDate: function (sDate) {
			var d = new Date(sDate);
			d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
			return d;
		},

		/**
		 * Removes leading zeros from an order/equipment number string.
		 * @param {string} text - raw value with leading zeros
		 * @returns {string} trimmed value
		 */
		removeLeadingZeros: function (text) {
			return text ? text.replace(/^0+/, "") : text;
		}
	});
});
