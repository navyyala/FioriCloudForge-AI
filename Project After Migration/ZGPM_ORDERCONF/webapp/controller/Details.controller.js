sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/format/NumberFormat",
	"PO_MAINTENANCE/util/stockOutputHelper",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox"
], function(Controller, NumberFormat, stockOutputHelper, Filter, FilterOperator, MessageToast, MessageBox) {
	"use strict";

	/**
	 * @namespace PO_MAINTENANCE.controller
	 * @class PO_MAINTENANCE.controller.Details
	 * @extends sap.ui.core.mvc.Controller
	 * Detail controller for order confirmation.
	 * Manages order items, attachments, IATF/Maintenance counters,
	 * stock output, takeover, and final/partial confirmation.
	 */
	return Controller.extend("PO_MAINTENANCE.view.Details", {
		stockOutputHelper: stockOutputHelper,
		_sItemPath: "",
		_sNavigationPath: "",
		_oResourceBundle: null,

		/**
		 * @override
		 * Initialises fragment IDs, loads static fragments, sets up deferred OData groups,
		 * attaches the route pattern matched handler, and loads apptype-specific items fragment.
		 */
		onInit: function() {
			this._oView = this.getView();
			this._oComponent = this.getOwnerComponent();
			this._oRouter = this._oComponent.getRouter();
			this._frgIdItems = this._oView.getId() + "-items";
			this._frgIdAttachments = this._oView.getId() + "-attachments";
			this._frgIdDetails = this._oView.getId() + "-details";
			this._frgIdArticles = this._oView.getId() + "-articles";
			this._frgIdEditItemDialog = this._oView.getId() + "-editItemDialog";
			this._frgIdAddArticleDialog = this._oView.getId() + "-addArticleDialog";
			this._frgIdSearchArticleDialog = this._oView.getId() + "-searchArticleDialog";
			this._frgIdStorageLocationDialog = this._oView.getId() + "-storageLocationDialog";
			this._frgIdHierarchyDialog = this._oView.getId() + "-hierarchyDialog";
			this._frgIdTakeOverDialog = this._oView.getId() + "-takeOverDialog";
			this._frgIdaddEditItemDialog = this.getView().getId() + "-addEditItem";
			this._frgIdConditionDialog = this._oView.getId() + "-conditionDialog";
			

			//JII 4410 start
			this._frgIdIatfCounter = this._oView.getId() + "-IATFCounter";
			this._frgIdMaintenanceCounter = this._oView.getId() + "-MaintenanceCounter";
			//JII 4410 end
			this._frgIdFileUpload = this._oView.getId() + "-attachmentUploader";
			// this._frgPokayokeCode = this._oView.getId() + "-pokayokeCodeDialog";
			//	this._oComponent.getModel().setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
			var oModel = this._oComponent.getModel();
			oModel.setDeferredGroups(["editIATF", "OrderList", "OrderItems", "editMaintCounter"]);
			oModel.setChangeGroups({
				"IATFCounters": {
					groupId: "editIATF"
				},
				"ORDERLIST": {
					groupId: "OrderList"
				},
				"ORDERITEMS": {
					groupId: "OrderItems"
				},
				"MaintCounters": {
					groupId: "editMaintCounter"
				}
			});

			this._frgAttachments = sap.ui.xmlfragment(this._frgIdAttachments, "PO_MAINTENANCE.view.fragment.attachments", this);
			this._frgDetails = sap.ui.xmlfragment(this._frgIdDetails, "PO_MAINTENANCE.view.fragment.details", this);
			this._frgArticles = sap.ui.xmlfragment(this._frgIdArticles, "PO_MAINTENANCE.view.fragment.articlesConso", this);
			this._editItemDialog = sap.ui.xmlfragment(this._frgIdEditItemDialog, "PO_MAINTENANCE.view.fragment.editItem", this);
			this._addArticleDialog = sap.ui.xmlfragment(this._frgIdAddArticleDialog, "PO_MAINTENANCE.view.fragment.addArticle", this);
			this._takeOverDialog = sap.ui.xmlfragment(this._frgIdTakeOverDialog, "PO_MAINTENANCE.view.fragment.PriseEnCharge", this);
			this._frgIatf = sap.ui.xmlfragment(this._frgIdIatfCounter, "PO_MAINTENANCE.view.fragment.IATFCounter", this);
			this._frgMaintenance = sap.ui.xmlfragment(this._frgIdMaintenanceCounter, "PO_MAINTENANCE.view.fragment.MaintenanceCounter", this);
			//	this._frgAttachUploader = sap.ui.xmlfragment(this._frgIdMaintenanceCounter, "PO_MAINTENANCE.view.fragment.attachmentUploader", this);
			//this._frgMaintenance = sap.ui.xmlfragment("PO_MAINTENANCE.view.fragment.maintenance", this); 
			// JII 3786 Functional Location - start TMA_NAVAY
			this._frgIdPosteTechnique = this._oView.getId() + "-posteTechniqueFrg"; //JII 3786
			this._frgIdEquipement = this._oView.getId() + "-equipementFrg"; //JII 3786
			// Functional Location - end

			this._oView.addDependent(this._editItemDialog);
			this._oView.addDependent(this._addArticleDialog);
			this._oView.addDependent(this._takeOverDialog);
			this._oView.addDependent(this._frgMaintenance);
			//	this._oView.addDependent(this._frgAttachUploader);
			// this._frgPokayokeCode = sap.ui.xmlfragment(this._frgPokayokeCode, "PO_MAINTENANCE.view.fragment.addPokayokeCode", this);

			this.getView().byId("filterItems").addContent(this._frgItems);
			this.getView().byId("filterAttachment").addContent(this._frgAttachments);
			this.getView().byId("filterDetails").addContent(this._frgDetails);
			this.getView().byId("filterArticles").addContent(this._frgArticles);
			this._bPokayokes = "";
			this._bSafety = "";
			// this.oView.byId("filterArticles").addContent(this._frgPokayokeCode);
			this._oResourceBundle = this._oComponent.getModel("i18n").getResourceBundle();
			// Get Context Path for Page 2 Screen
			this._oRouter.attachRoutePatternMatched(this._onRoutePatternMatched, this);

			// this._oView.byId("cb_causecode").attachEvent("dataReceived", this._onCauseCodeDataReceived, this);
			// this._oView.byId("cb_causecode").getBinding("items").attachDataReceived(this._onCauseCodeDataReceived, this);
			// this._oView.byId("cb_failcode").getBinding("items").attachDataReceived(this._onFailCodeDataReceived, this);

			this._appType = "C";
			this.countAD = 0;
			this.countADFuture = 0;
			this.countADPast = 0;

			// Jii-3786 Functional location value help - TMA_NAVAY
			this.functionalLocation = this.getView().byId("txt_posteTechnique"); //Jii-3786
			this.equipmentField = this.getView().byId("txt_equipement"); //JII-3786
			// Functional Location - end

			if (this._oComponent.getComponentData()) {
				if (this._oComponent.getComponentData().startupParameters.apptype) {
					this._appType = this._oComponent.getComponentData().startupParameters.apptype[0];
					if (this._appType === "P") {
						this._frgItemsPrev = sap.ui.xmlfragment(this._frgIdItems, "PO_MAINTENANCE.view.fragment.preventiveItems", this);
						this.getView().byId("filterItems").addContent(this._frgItemsPrev);
						//this._oView.byId("num_tempsArret").setVisible(false);
						this._oView.byId("breadDownTimeData").setVisible(false);

					} else if (this._appType === "C") {
						this._frgItems = sap.ui.xmlfragment(this._frgIdItems, "PO_MAINTENANCE.view.fragment.items", this);
						this.getView().byId("filterItems").addContent(this._frgItems);
					}
				} else {
					this._frgItems = sap.ui.xmlfragment(this._frgIdItems, "PO_MAINTENANCE.view.fragment.items", this);
					this.getView().byId("filterItems").addContent(this._frgItems);
				}
			}
		},
		onAfterRendering: function() {
			// hide poke yoke, safety and status
			this._oView.byId("num_tempsArret").setValue();
			this._oView.byId("num_tempsTotalIntervention").addEventDelegate({
				onkeydown: function(event) {
					if (event.key === "ArrowUp" || event.key === "ArrowDown") {
						event.preventDefault();
					}
				}
			});

			this._oView.byId("num_tempsArret").addEventDelegate({
				onkeydown: function(event) {
					if (event.key === "ArrowUp" || event.key === "ArrowDown") {
						event.preventDefault();
					}
				}
			});
		},

		_onRoutePatternMatched: function(oEvent) {
			var self = this;
			//	this.finalConfUserChange = false;
			this._oView.getModel().resetChanges();
			this.aufnr = this.getView().getModel().getProperty("/" + oEvent.getParameters().arguments.entity).Aufnr;
			this.getView().byId("itbMain").setSelectedKey("activity");
			// this.getView().getModel("orderitem").read("/ORDERITEMSSet", function(oData) {
			// 	this.getModel("orderitem").setProperty("/", oData.results);
			// }.bind(this));
			var IATFtable = sap.ui.core.Fragment.byId(this._frgIdIatfCounter, "filterIATFCounter");
			var MaintTable = sap.ui.core.Fragment.byId(this._frgIdMaintenanceCounter, "filterMaintCounter");
			var itafModel = IATFtable.getModel();
			var itafItems = IATFtable.getItems();
			var data;

			for (var i = 0; i < itafItems.length; i++) {
				data = itafModel.getProperty(itafItems[i].getBindingContextPath());
				itafItems[i].getCells()[5].setValueState(sap.ui.core.ValueState.None);
				itafItems[i].getCells()[5].setValueStateText("");
			}

			var maintModel = MaintTable.getModel();
			var maintItems = MaintTable.getItems();
			var dataMaint;
			for (var i = 0; i < maintItems.length; i++) {
				dataMaint = maintModel.getProperty(maintItems[i].getBindingContextPath());
				maintItems[i].getCells()[4].setValueState(sap.ui.core.ValueState.None);
				maintItems[i].getCells()[4].setValueStateText("");

			}

			if (oEvent.getParameter("name") !== "details") {
				return;
			}
			//this.getOwnerComponent().getModel("orderitem").refresh(true); //Rebind the table to update the binding for the table - Nagamani
			//sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getBinding("items").refresh(true); //Rebind the table to update the binding for the table - Nagamani
			//tma_navay jii-4410
			if (this._oComponent.getComponentData().startupParameters.apptype && this._oComponent.getComponentData().startupParameters.ordertype) {
				if (this._oComponent.getComponentData().startupParameters.apptype[0] === "P" && this._oComponent.getComponentData().startupParameters
					.ordertype[0] === "ZM16") {
					// debugger;
					this.getView().byId("filterIATFCounter").setVisible(true);
					this.getView().byId("filterMaintenanceCounter").setVisible(true);

					this.getView().byId("filterIATFCounter").addContent(this._frgIatf);
					this.getView().byId("filterMaintenanceCounter").addContent(this._frgMaintenance);

					var IATFtable = sap.ui.core.Fragment.byId(this._frgIdIatfCounter, "filterIATFCounter");
					var MaintTable = sap.ui.core.Fragment.byId(this._frgIdMaintenanceCounter, "filterMaintCounter");
					/*	var data = {
							"IATFCountersSet": [{
								"Point": 515,
								"Pttxt": "Voltage Cabin 1",
								"Desir": 354,
								"Mrmin": 351,
								"Mrmax": 357,
								"Centric": "",
								"Mdtxt": ""
							}, {
								"Point": 212,
								"Pttxt": "Pressure Cabin 1",
								"Desir": 17,
								"Mrmin": 16,
								"Mrmax": 18,
								"Centric": "",
								"Mdtxt": ""
							}]
						};
						var iatfModel = new sap.ui.model.json.JSONModel(data);
						IATFtable.setModel(iatfModel);
					*/
					var fnloc = this.getView().getModel().getProperty("/" + oEvent.getParameters().arguments.entity).Tplnr;
					//	+ " - " + this.getView().getModel().getProperty("/"+oEvent.getParameters().arguments.entity).Tplnrtxt;
					var Aufnr = this.getView().getModel().getProperty("/" + oEvent.getParameters().arguments.entity).Aufnr;
					var Equnr = this.getView().getModel().getProperty("/" + oEvent.getParameters().arguments.entity).Equnr;
					var aFilters = [];
					aFilters.push(new sap.ui.model.Filter("Tplnr", sap.ui.model.FilterOperator.EQ, fnloc));
					aFilters.push(new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, Aufnr));
					if (Equnr != '') {
						aFilters.push(new sap.ui.model.Filter("Equnr", sap.ui.model.FilterOperator.EQ, Equnr));
					}
					// IATFtable.bindItems({path:"/IATFCountersSet",filters:aFilters});
					MaintTable.getBinding("items").filter(aFilters);
					IATFtable.getBinding("items").filter(aFilters);
					//	IATFtable.getModel().setDefaultBindingMode("TwoWay");

				}

			}

			if (this._oComponent._appType === "P") {
				sap.ui.core.Fragment.byId(this._frgIdDetails, "failureCatLbl").setVisible(false);
				sap.ui.core.Fragment.byId(this._frgIdDetails, "filtre_EchecCatalogue").setVisible(false);
				sap.ui.core.Fragment.byId(this._frgIdDetails, "failureCodeLbl").setVisible(false);
				sap.ui.core.Fragment.byId(this._frgIdDetails, "failureCodeTxt").setVisible(false);

			}
			this._sFrom = oEvent.getParameters().arguments.from;
			this._sItemPath = "/" + oEvent.getParameters().arguments.entity;
			this._sNavigationPath = this._sItemPath + "/" + "";
			var orderSelected = this._sItemPath.split("'")[1];
			// [+] KMG 10/09/2020 START
			// Filter catalogs by functional location
			var oFilters;
			var sFuncLoc = this.getView().getModel().getProperty(this._sItemPath + "/Tplnr");
			// var oFuncCb = this.byId("");
			var oCauseCb = this.byId("cb_cause");
			var oFailCb = this.byId("cb_fail");
			// if (oFuncCb) {
			// 	oFilters = [(new sap.ui.model.Filter("Tplnr", "EQ", sFuncLoc))];
			// 	oFuncCb.getBinding("items").filter(oFilters);
			// }
			if (oCauseCb) {
				oFilters = [(new sap.ui.model.Filter("Tplnr", "EQ", sFuncLoc))];
				oCauseCb.getBinding("items").filter(oFilters);
			}
			if (oFailCb) {
				oFilters = [(new sap.ui.model.Filter("Tplnr", "EQ", sFuncLoc))];
				oFailCb.getBinding("items").filter(oFilters);
			}
			//JII 3786
			if (this._appType === "C") {
				//JII 4410 
				this.getView().byId("filterIATFCounter").setVisible(true);
				this.getView().byId("filterMaintenanceCounter").setVisible(true);

				this.getView().byId("filterIATFCounter").addContent(this._frgIatf);
				this.getView().byId("filterMaintenanceCounter").addContent(this._frgMaintenance);

				var IATFtable1 = sap.ui.core.Fragment.byId(this._frgIdIatfCounter, "filterIATFCounter");
				var MaintTable1 = sap.ui.core.Fragment.byId(this._frgIdMaintenanceCounter, "filterMaintCounter");
				var fnloc1 = this.getView().getModel().getProperty("/" + oEvent.getParameters().arguments.entity).Tplnr;
				//	+ " - " + this.getView().getModel().getProperty("/"+oEvent.getParameters().arguments.entity).Tplnrtxt;
				var Aufnr1 = this.getView().getModel().getProperty("/" + oEvent.getParameters().arguments.entity).Aufnr;
				var Equnr1 = this.getView().getModel().getProperty("/" + oEvent.getParameters().arguments.entity).Equnr;
				var aFilters1 = [];
				aFilters1.push(new sap.ui.model.Filter("Tplnr", sap.ui.model.FilterOperator.EQ, fnloc1));
				aFilters1.push(new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.EQ, Aufnr1));
				if (Equnr1 != '') {
					aFilters1.push(new sap.ui.model.Filter("Equnr", sap.ui.model.FilterOperator.EQ, Equnr1));
				}
				//aFilters.push(new sap.ui.model.Filter("Aufnr",sap.ui.model.FilterOperator.EQ,this.equipmentField));
				// IATFtable.bindItems({path:"/IATFCountersSet",filters:aFilters});
				MaintTable1.getBinding("items").filter(aFilters1);
				IATFtable1.getBinding("items").filter(aFilters1);

				var currentDate = new Date();
				var currentTime = currentDate.getHours() + ":" + currentDate.getMinutes() + ":" + currentDate.getSeconds();
				var activiTime, dateStr;
				var currentdate = new Date();
				// var creationDateSel = this.getView().byId("breakdownstartdateid").getDateValue();
				var creationDateSel = this.getView().getModel().getProperty(self._sItemPath + "/Ausvn");
				this.getView().byId("activitydateid").setMaxDate(currentdate);
				this.getView().byId("activitydateid").setMinDate(creationDateSel);

				//JII 4410 RAGOW Catalog function and function code
				this.getView().byId("cb_CatFunc").setVisible(true);
				this.getView().byId("cb_FunCode").setVisible(true);

				// Functional Locationa dn Equipment Value Help
				this.functionalLocation.setEnabled(true);
				this.equipmentField.setEnabled(true);

				// Break down Start Date andTime
				this.getView().byId("breakdownstartdateid").setVisible(true);
				this.getView().byId("breakdownstarttimeid").setVisible(true);

				var timevalue = this.getView().getModel().getProperty(self._sItemPath + "/Auztv");
				if (timevalue != "" && timevalue != undefined) {

					this.getView().byId("breakdownstarttimeid").setValue(timevalue);
				} else {
					this.getView().byId("breakdownstarttimeid").setValue(currentTime);
				}

				var datevalue = this.getView().getModel().getProperty(self._sItemPath + "/Ausvn");
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.yyyy"
				});

				if (datevalue != "" && datevalue != undefined) {
					dateStr = dateFormat.format(new Date(datevalue));
				} else {

					dateStr = dateFormat.format(currentDate);
				}
				this.getView().byId("breakdownstartdateid").setValue(dateStr);

				//4190 start

				//	this.getView().byId("notiffailuredateid").setVisible(true);
				//	this.getView().byId("notiffailuretimeid").setVisible(true);

				timevalue = this.getView().getModel().getProperty(self._sItemPath + "/Notiftime");

				/*	if (timevalue != "" && timevalue != undefined) {

				this.getView().byId("notiffailuretimeid").setValue(timevalue);
			} else {
				this.getView().byId("notiffailuretimeid").setValue(currentTime);
			}
*/
				datevalue = this.getView().getModel().getProperty(self._sItemPath + "/Notifdate");
				dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.yyyy"
				});

				if (datevalue != "" && datevalue != undefined) {
					dateStr = dateFormat.format(new Date(datevalue));
				} else {

					dateStr = dateFormat.format(currentDate);
				}
				//	this.getView().byId("notiffailuredateid").setValue(dateStr);

				this.getView().byId("activitydateid").setVisible(true);
				this.getView().byId("activitytimeid").setVisible(true);

				//	this.getView().byId("activitydateid").setValue("");
				//	this.getView().byId("activitytimeid").setValue("");

				activiTime = this.getView().getModel().getProperty(self._sItemPath + "/ActivityStarttime");

				if (activiTime != "000000" && activiTime != undefined) {
					this.getView().byId("activitytimeid").setValue(activiTime);
					this.getView().byId("activitytimeid").setEnabled(false);
				} else {
					this.getView().byId("activitytimeid").setValue(currentTime);
					this.getView().byId("activitytimeid").setEnabled(true);
				}

				datevalue = this.getView().getModel().getProperty(self._sItemPath + "/ActivityStartdate");
				dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
					pattern: "dd.MM.yyyy"
				});
				if (datevalue != "" && datevalue != undefined && datevalue != null) {
					dateStr = dateFormat.format(new Date(datevalue));
					this.getView().byId("activitydateid").setValue(dateStr);
					this.getView().byId("activitydateid").setEnabled(false);
				} else {

					this.getView().byId("activitydateid").setValue(dateFormat.format(currentDate));
					this.getView().byId("activitydateid").setEnabled(true);
					//dateStr = dateFormat.format(currentDate);
					//this.getView().byId("activitydateid").setValue("");
				}

				//this.getView().byId("activitydateid").setValue(dateStr);

				//4190 end

			}
			//JII 3786
			// [+] KMG 10/09/2020 END
			// Bind Object Header and Form using oData
			if (this.getOwnerComponent().getModel().getProperty(this._sItemPath)) {
				this.byId("DetailsPage").bindElement({
					path: this._sItemPath
				});
				if (this.getView().getModel().getProperty(self._sItemPath + "/TakPernr") &&
					this.getView().getModel().getProperty(self._sItemPath + "/TakPernr") !== "00000000") {
					this._oView.getModel().setProperty(self._sItemPath + "/Pernr", this.getView().getModel().getProperty(self._sItemPath +
						"/TakPernr"));
					this._oView.getModel().setProperty(self._sItemPath + "/Status", "A");
					// self._oView.getModel().updateBindings(true);
					self._oView.byId("cb_intervenant").setSelectedKey(this.getView().getModel().getProperty(self._sItemPath + "/TakPernr"));
					// console.log("0: " + oData.results[0].TakPernr);
				}
				if (this.getView().getModel().getProperty(self._sItemPath + "/Description").split("\n").length > 1) {
					self._oView.byId("txt_description").setRows(this.getView().getModel().getProperty(self._sItemPath + "/Description").split("\n").length +
						1);
				}

				setTimeout(function() {
					self.getView().getModel().resetChanges([self._sItemPath]);
					var curFail = self.getView().getModel().getProperty(self._sItemPath + "/Fegrp");
					var curFailCode = self.getView().getModel().getProperty(self._sItemPath + "/Fecod");
					var curCause = self.getView().getModel().getProperty(self._sItemPath + "/Urgrp");
					var curCauseCode = self.getView().getModel().getProperty(self._sItemPath + "/Urcod");
					var curFunction = self.getView().getModel().getProperty(self._sItemPath + "/Function");
					var curFunctionCode = self.getView().getModel().getProperty(self._sItemPath + "/FunctionCode");
					var aFilterTmp = [];
					if (curFail) {
						aFilterTmp = [];
						aFilterTmp.push(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, curFail));
						self._oView.byId("cb_failcode").getBinding("items").filter(aFilterTmp);
					}
					if (curCause) {
						aFilterTmp = [];
						aFilterTmp.push(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, curCause));
						self._oView.byId("cb_causecode").getBinding("items").filter(aFilterTmp);
					}
					//JII - 4410
					if (curFunction) {
						aFilterTmp = [];
						aFilterTmp.push(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, curFunction));
						self._oView.byId("cb_FunCode").getBinding("items").filter(aFilterTmp);
					} /// JII - 4410
					setTimeout(function() {
						self._oView.byId("cb_failcode").setSelectedKey(curFailCode);
						self._oView.byId("cb_failcode").setEnabled(true);
						self._oView.byId("cb_causecode").setSelectedKey(curCauseCode);
						self._oView.byId("cb_causecode").setEnabled(true);
						self._oView.byId("cb_FunCode").setSelectedKey(curFunctionCode); // Jii- 4410
						self._oView.byId("cb_FunCode").setEnabled(true); //JII 4410
						self._oView.getModel().updateBindings(true);
					}, 1000);
				}, 1000);
			} else {
				var aFilters = [new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, orderSelected)];
				// var aFilters = [new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, orderSelected)];
				if (this._appType === 'P') {
					aFilters.push(new sap.ui.model.Filter("Apptype", sap.ui.model.FilterOperator.Contains, this._appType));
				}
				this.getView().getModel().read("/ORDERLISTSet", {
					filters: aFilters,
					success: function(oData) {
						if (oData.results.length > 0) {
							var curFail = self.getView().getModel().getProperty(self._sItemPath + "/Fegrp");
							var curFailCode = self.getView().getModel().getProperty(self._sItemPath + "/Fecod");
							var curCause = self.getView().getModel().getProperty(self._sItemPath + "/Urgrp");
							var curCauseCode = self.getView().getModel().getProperty(self._sItemPath + "/Urcod");
							var curPernr = self.getView().getModel().getProperty(self._sItemPath + "/TakPernr");
							var sTechId = self._oComponent.getModel("external").getProperty("/technician");
							self.sPernr = "00000000";
							// if (sTechId) {
							// 	oData.results[0].Pernr = sTechId;
							// } else if (oData.results[0].TakPernr !== "00000000") {
							// 	oData.results[0].Pernr = oData.results[0].TakPernr;
							// }
							if (oData.results[0].TakPernr && oData.results[0].TakPernr !== "00000000") {
								self._oView.getModel().setProperty(self._sItemPath + "/Pernr", oData.results[0].TakPernr);
								oData.results[0].Pernr = oData.results[0].TakPernr;
								self.sPernr = oData.results[0].TakPernr;
								self._oView.byId("cb_intervenant").setSelectedKey(oData.results[0].TakPernr);
								self._oView.getModel().updateBindings(true);
								// console.log("1: " + oData.results[0].TakPernr);
							} else if (sTechId && sTechId !== "00000000") {
								self._oView.getModel().setProperty(self._sItemPath + "/Pernr", sTechId);
								self._oView.getModel().setProperty(self._sItemPath + "/TakPernr", sTechId);
								oData.results[0].Pernr = sTechId;
								oData.results[0].TakPernr = sTechId;
								self.sPernr = sTechId;
								self._oView.byId("cb_intervenant").setSelectedKey(sTechId);
								self._oView.getModel().updateBindings(true);
								// console.log("2: " + sTechId);
							} else if (curPernr && curPernr !== "00000000") {
								self._oView.getModel().setProperty(self._sItemPath + "/Pernr", curPernr);
								self._oView.getModel().setProperty(self._sItemPath + "/TakPernr", curPernr);
								self._oView.getModel().setProperty(self._sItemPath + "/Status", "A");
								oData.results[0].Pernr = curPernr;
								oData.results[0].TakPernr = curPernr;
								oData.results[0].Status = "A";
								self.sPernr = curPernr;
								self._oView.byId("cb_intervenant").setSelectedKey(curPernr);
								self._oView.getModel().updateBindings(true);
								// console.log("3: " + curPernr);
							} else {
								self._oView.byId("cb_intervenant").setSelectedKey();
								// console.log("4: no pernr");
							}
							self.getOwnerComponent().getModel().oData["ORDERLISTSet('" + oData.results[0].Aufnr + "')"] = oData.results[0];

							if (oData.results[0].Fegrp) {
								curFail = oData.results[0].Fegrp;
							}
							if (oData.results[0].Fecod) {
								curFailCode = oData.results[0].Fecod;
							}

							if (oData.results[0].Urgrp) {
								curCause = oData.results[0].Urgrp;
							}
							if (oData.results[0].Urcod) {
								curCauseCode = oData.results[0].Urcod;
							}

							if (oData.results[0].Description.split("\n").length > 1) {
								self._oView.byId("txt_description").setRows(oData.results[0].Description.split("\n").length + 1);
							}

							var aFilterTmp = [];
							if (curFail) {
								aFilterTmp = [];
								aFilterTmp.push(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, curFail));
								self._oView.byId("cb_failcode").getBinding("items").filter(aFilterTmp);
							}
							if (curCause) {
								aFilterTmp = [];
								aFilterTmp.push(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, curCause));
								self._oView.byId("cb_causecode").getBinding("items").filter(aFilterTmp);
							}

							setTimeout(function() {
								self._oView.byId("cb_failcode").setSelectedKey(curFailCode);
								self._oView.byId("cb_failcode").setEnabled(true);
								self._oView.byId("cb_causecode").setSelectedKey(curCauseCode);
								self._oView.byId("cb_causecode").setEnabled(true);

								if (self.sPernr && self.sPernr !== "00000000" && self._oView.getModel().getProperty(self._sItemPath + "/Pernr") !==
									"00000000") {
									self._oView.getModel().setProperty(self._sItemPath + "/Pernr", self.sPernr);
									self._oView.getModel().setProperty(self._sItemPath + "/TakPernr", self.sPernr);
									self._oView.byId("cb_intervenant").setSelectedKey(self.sPernr);
									// console.log("5: " + self.sPernr);
								}
								self._oView.getModel().updateBindings(true);
							}, 1500);
						}
						self.byId("DetailsPage").bindElement({
							path: self._sItemPath
						});
					},
					error: function(oError) {

					}
				});
			}
			var filters = [];
			// Bind Items table
			var itemTable = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems");

			if (orderSelected && orderSelected.length > 0) {
				filters = [new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, orderSelected)];
				itemTable.getBinding("items").filter(filters);

				this.getOwnerComponent().getModel("orderitem").refresh(true);
			}
			// Bind Attachs uploads
			var attachsUpload = sap.ui.core.Fragment.byId(this._frgIdAttachments, "uploads");
			var attachmentTable = sap.ui.core.Fragment.byId(this._frgIdAttachments, "attachments");
			if (orderSelected && orderSelected.length > 0) {
				filters = [new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, orderSelected)];
				var curTplnr = this.getView().getModel().getProperty(this._sItemPath + "/Tplnr");
				filters.push(new sap.ui.model.Filter("Tplnr", sap.ui.model.FilterOperator.Contains, curTplnr));
				var curEqunr = this.getView().getModel().getProperty(this._sItemPath + "/Equnr");
				filters.push(new sap.ui.model.Filter("Equnr", sap.ui.model.FilterOperator.Contains, curEqunr));
				attachsUpload.getBinding("items").filter(filters);

				//doclist filters
				var curTplnr1 = this.getView().getModel().getProperty(this._sItemPath + "/Tplnr");
				var attachFilter = [(new sap.ui.model.Filter("FuncLoc", sap.ui.model.FilterOperator.Contains, curTplnr1))];
				attachmentTable.getBinding("items").filter(attachFilter);
			}
			// Bind Articles table
			var articleTable = sap.ui.core.Fragment.byId(this._frgIdArticles, "tableItems");
			var bomTable = sap.ui.core.Fragment.byId(this._frgIdArticles, "billOfMaterialTable");
			var stockReturnTable = sap.ui.core.Fragment.byId(this._frgIdArticles, "tableItemsStockReturn");
			if (orderSelected && orderSelected.length > 0) {
				filters = [new sap.ui.model.Filter("Aufnr", sap.ui.model.FilterOperator.Contains, orderSelected)];
				articleTable.getBinding("items").filter(filters);
				stockReturnTable.getBinding("items").filter(filters);
				//bind filters to BoM table
				filters = [new sap.ui.model.Filter("Tplnr", sap.ui.model.FilterOperator.Contains, this.getView().getModel().getProperty(this._sItemPath +
						"/Tplnr")),
					new sap.ui.model.Filter("Equnr", sap.ui.model.FilterOperator.Contains, this.getView().getModel().getProperty(this._sItemPath +
						"/Equnr"))
				];
				bomTable.getBinding("items").filter(filters);

			}
			// Maintain visibility
			// if (this._oView.byId("txt_equipement").getText() === "") {
			// 	this._oView.byId("txt_equipement").setVisible(false);
			// 	this._oView.byId("lbl_equipement").setVisible(false);
			// } else {
			// 	this._oView.byId("txt_equipement").setVisible(true);
			// 	this._oView.byId("lbl_equipement").setVisible(true);
			// }

			if (this._appType === "P") {
				this._oView.byId("cb_failcode").setVisible(false);
				this._oView.byId("cb_fail").setVisible(false);
				this._oView.byId("cb_causecode").setVisible(false);
				this._oView.byId("cb_cause").setVisible(false);
			}
			var self = this;
			setTimeout(function() {
				// attendre le chargement des données avant d'afficher les élements choisis
				// Set WorkGroup and WorkType
				// var curGroup = self.getView().getModel().getProperty(self._sItemPath + "/Urgrp");
				// var curWorktype = self.getView().getModel().getProperty(self._sItemPath + "/Urcod");
				var curPernr = self.getView().getModel().getProperty(self._sItemPath + "/TakPernr");
				var sTechId = self._oComponent.getModel("external").getProperty("/technician");
				// self._oView.byId("cb_fail").setSelectedKey(curGroup);

				// if (curGroup) {
				// 	var aFilterTmp = [];
				// 	aFilterTmp.push(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, curGroup));
				// 	self._oView.byId("cb_failcode").getBinding("items").filter(aFilterTmp);
				// }

				// setTimeout(function () {
				// 	self._oView.byId("cb_failcode").setSelectedKey(curWorktype);
				// 	self._oView.byId("cb_failcode").setEnabled(true);
				// }, 1000);
				if (sTechId && sTechId !== "00000000") {
					self._oView.getModel().setProperty(self._sItemPath + "/Pernr", sTechId);
					self._oView.getModel().setProperty(self._sItemPath + "/TakPernr", sTechId);
					self._oView.getModel().updateBindings(true);
					// console.log("6: " + sTechId);
				} else if (curPernr !== "00000000") {
					self._oView.getModel().setProperty(self._sItemPath + "/Pernr", curPernr);
					self._oView.getModel().updateBindings(true);
					// console.log("7: " + curPernr);
				} else {
					self._oView.byId("cb_intervenant").setSelectedKey();
					// console.log("8: no pernr");
				}
			}, 1000);

			this._oComponent.getModel("PokayokeModel").setProperty("/PokayokeIDCode", "");

			// Get upload token
			this.getUploadToken();
			//JII - 3786 Functiona Location - start TMA_NAVAY
			var functLoc = this.getView().getModel().getProperty(this._sItemPath).Tplnr + " - " + this.getView().getModel().getProperty(this._sItemPath)
				.Tplnrtxt;
			var equnrFiledValue = this.getView().getModel().getProperty(this._sItemPath).Equnr + " - " + this.getView().getModel().getProperty(
				this._sItemPath).Equnrtxt;
			this.functionalLocation.setValue(functLoc);
			this.equipmentField.setValue(equnrFiledValue);

			// Code for getting Object Type for selected Item - Added by TMA_NAVAY
			var filArr = [];
			var filterName = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, this.getView().getModel().getProperty(this._sItemPath)
				.Tplnr);
			filArr.push(filterName);
			this.getView().getModel().read("/FUNCLEVELSet", {
				filters: filArr,
				success: function(data) {
					this.ObjType = data.results[0].ObjType;
					this.funcLocObj = data.results[0];
				}.bind(this)
			});
			//end TMA_NAVAY

		},

		_onCauseCodeDataReceived: function(oEvent) {
			var ok = "";
		},
		_onFailCodeDataReceived: function(oEvent) {
			var ok = "";
		},

		onNavBack: function() {
			this._oView.getModel().resetChanges();
			this._oView.getModel("orderitem").resetChanges();
			//sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").unbindItems();
			this._oView.getModel("orderitem").removeData();
			if ("mainExt" === this._sFrom) {
				var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
				var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
					target: {
						semanticObject: "ZPMSEMORDERCREATE",
						action: "DISPLAY_G"
					}
				})) || "";
				oCrossAppNavigator.toExternal({
					target: {
						shellHash: hash
					}
				});

				return;
			} else {
				this._oRouter.navTo("main");
				this._oView.getModel().resetChanges();
			}
		},
		clearAll: function() {
			var self = this;
			this._oView.byId("cb_intervenant").setSelectedKey();
			this._oView.byId("num_tempsTotalIntervention").setValue();
			this._oView.byId("num_tempsArret").setValue();
			this._oView.byId("cb_intervenant").setValueState("None");
			this._oView.byId("num_tempsTotalIntervention").setValueState("None");
			this._oView.byId("num_tempsArret").setValueState("None"); // this._oView.getModel().resetChanges();

			this._oView.byId("cb_fail").setSelectedKey();
			this._oView.byId("cb_fail").setValueState("None");
			this._oView.byId("cb_failcode").setSelectedKey();
			this._oView.byId("cb_failcode").setValueState("None");
			this._oView.byId("cb_cause").setSelectedKey();
			this._oView.byId("cb_cause").setValueState("None");
			this._oView.byId("cb_causecode").setSelectedKey();
			this._oView.byId("cb_causecode").setValueState("None");
			// this._oView.byId("cb_pokayokes").setSelected(false);
			// this._oView.byId("cb_safety").setSelected(false);
			this._oView.byId("cb_failcode").setEnabled(false);
			this._oView.byId("cb_causecode").setEnabled(false);

			var itemsData = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
			jQuery.each(itemsData, function(i, item) {
				var cells = item.getCells();
				// JRO - Status not use
				// for (var j = 0; j < 3; j++) {&nbsp;

				// 	if (self._appType === "C") {
				// 		cells[12 + j].setSelected(false);
				// 	} else if (self._appType === "P") {
				// 		cells[11 + j].setSelected(false);
				// 	} else {
				// 		cells[12 + j].setSelected(false);
				// 	}
				// }
				// Fin JRO
				cells[1].setSelected(false);
				cells[2].setSelected(false);
			});

		},
		onQuitter: function(from) {
			if (from === "confirmed") {
				if (this._sFrom === "mainExt") {
					this.navToHome();
				} else {
					this.clearAll();
					this.onNavBack();
				}
				return;
			}
			var self = this;
			//Confirmation dialog
			var dialog = new sap.m.Dialog({
				title: self._oResourceBundle.getText("titreMsgCancel"),
				type: "Message",
				content: new sap.m.Text({
					text: self._oResourceBundle.getText("confirmAnnulation")
				}),
				beginButton: new sap.m.Button({
					text: self._oResourceBundle.getText("btnOui"),
					press: function() {
						if (self._sFrom === "mainExt") {
							dialog.close();
							self.navToCreateOrderApp();
						} else {
							//Clear all + Close dialog + Nav back
							self.clearAll();
							dialog.close();
							// self.onNavBack();
							self._oRouter.navTo("main");

						}
					}
				}),
				endButton: new sap.m.Button({
					text: self._oResourceBundle.getText("btnNon"),
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});
			dialog.open();
		},
		onConfirmed: function() {
			var self = this;
			// Vérification des champs obligatoires
			var headerIntervenant = this._oView.byId("cb_intervenant");
			var headerTotalTime = this._oView.byId("num_tempsTotalIntervention");
			var headerStopTime = this._oView.byId("num_tempsArret");
			var headerFailGroup = this._oView.byId("cb_fail");
			var headerFailCode = this._oView.byId("cb_failcode");
			var headerCause = this._oView.byId("cb_cause");
			var headerCauseCode = this._oView.byId("cb_causecode");
			var headerCatalogfun = this._oView.byId("cb_CatFunc"); //4410
			var headerFunctionCode = this.
			_oView.byId("cb_FunCode"); //4410
			headerIntervenant.setValueState("None");
			headerTotalTime.setValueState("None");
			headerStopTime.setValueState("None");
			headerCause.setValueState("None");
			headerCauseCode.setValueState("None");
			headerCatalogfun.setValueState("None"); //4410
			headerFunctionCode.setValueState("None"); //4410
			headerFailGroup.setValueState("None");
			headerFailCode.setValueState("None");
			if (headerIntervenant.getSelectedKey() === "00000000" || headerIntervenant.getSelectedKey() === "") {
				if (this._oComponent.getModel("external") && this._oComponent.getModel("external").getProperty("/technician") !== "00000000") {
					this._oView.getModel().setProperty(self._sItemPath + "/Pernr", this._oComponent.getModel("external").getProperty("/technician"));
				} else {
					headerIntervenant.setValueState("Error");
					return;
				}
			}
			if (this._appType === "C" && (headerFailGroup.getSelectedKey() === "00000000" | headerFailGroup.getSelectedKey() === "")) {
				headerFailGroup.setValueState("Error");
				return;
			}
			if (this._appType === "C" && (headerFailCode.getSelectedKey() === "00000000" | headerFailCode.getSelectedKey() === "")) {
				headerFailCode.setValueState("Error");
				return;
			}
			if (this._appType === "C" && (headerCause.getSelectedKey() === "00000000" | headerCause.getSelectedKey() === "")) {
				headerCause.setValueState("Error");
				return;
			}
			if (this._appType === "C" && (headerCauseCode.getSelectedKey() === "00000000" | headerCauseCode.getSelectedKey() === "")) {
				headerCauseCode.setValueState("Error");
				return;
			}
			//JII 4410 cat fuc & code start
			if (this._appType === "C" && (headerCatalogfun.getSelectedKey() === "00000000" | headerCatalogfun.getSelectedKey() === "")) {
				headerCatalogfun.setValueState("Error");
				return;
			}
			if (this._appType === "C" && (headerFunctionCode.getSelectedKey() === "00000000" | headerFunctionCode.getSelectedKey() === "")) {
				headerFunctionCode.setValueState("Error");
				return;
			}
			//4410 end
			if (headerTotalTime.getValue() === "") {
				headerTotalTime.setValueState("Error");
				return;
			}

			if (headerStopTime.getValue() === "" && this._appType === "P") {
				if (self.getOwnerComponent().getModel("displaySettings").getProperty("/breakdown")) {
					if (self.getOwnerComponent().getModel("displaySettings").getProperty("/breakdown").Mandatory === "X") {
						headerStopTime.setValueState("Error");
						return;
					} else {
						headerStopTime.setValue("0");
					}
				}
				// headerStopTime.setValueState("Error");
				// return;
			} else if (this._oComponent.getModel("confirmed") && this._appType === "C") {
				if (!this._oComponent.getModel("confirmed").getProperty("/breakdownTime") || this._oComponent.getModel("confirmed").getProperty(
						"/breakdownTime") === "") {
					headerStopTime.setValueState("Error");
					return;
				}
			}
			var itemsCheck = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
			var confModified = false;
			// jQuery.each(itemsCheck, function(i, item) {
			// 	var cells = item.getCells();
			// 	var parconf = cells[1].getSelected();
			// 	var finconf = cells[2].getSelected();
			// 	if (parconf | finconf) {
			// 		confModified = true;
			// 		return true;
			// 	}
			// });
			itemsCheck.forEach(function(item) {
				var cells = item.getCells();
				var enabled1 = cells[1].getEnabled();
				var enabled2 = cells[2].getEnabled();
				if (!(enabled1 && enabled2)) {
					return false;
				}
				var parconf = cells[1].getSelected();
				var finconf = cells[2].getSelected();
				if (parconf | finconf) {
					confModified = true;
					return true;
				}
			});

			if (!confModified) {
				sap.m.MessageBox.show(
					self._oResourceBundle.getText("confirmAtLeastOneOp"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: self._oResourceBundle.getText("titleConfirmAtLeastOneOp"),
						actions: [sap.m.MessageBox.Action.OK],
						onClose: function() {}
					}
				);
				return;
			}
			self.onValidOrders();

			//Header
			// var oHeader = {};
			// oHeader.Aufnr = this._sItemPath.split("'")[1];
			// oHeader.Description = this._oView.byId("txt_description").getValue();
			// oHeader.Conftime = headerTotalTime.getValue();
			// // oHeader.Eauszt = headerStopTime.getValue();
			// if (this._oComponent.getModel("confirmed")) {
			// 	oHeader.Eauszt = this._oComponent.getModel("confirmed").getProperty("/breakdownTime");
			// } else {
			// 	oHeader.Eauszt = headerStopTime.getValue();
			// }
			// oHeader.Pernr = headerIntervenant.getSelectedKey();

			// self.CheckImpactToPokaYokes();

			// oHeader.Pokayokes = this._oView.byId("cb_pokayokes").getSelected() ? "X" : "";
			// oHeader.Safety = this._oView.byId("cb_safety").getSelected() ? "X" : "";

			// var oItemData = this._oComponent.getModel().getProperty(this._sItemPath);
			// oHeader.Takeover = oItemData.Takeover;
			// oHeader.TakPernr = oItemData.TakPernr;
			// oHeader.TakDate = oItemData.TakDate;
			// oHeader.TakTime = oItemData.TakTime;

			// var selFailCode = this._oView.byId("cb_failcode");
			// var selFailCodeCode;
			// if (selFailCode && selFailCode.getSelectedItem()) {
			// 	selFailCodeCode = selFailCode.getSelectedItem().getKey();
			// }
			// var selFailGroup = this._oView.byId("cb_fail");
			// var selFailGroupCode;
			// if (selFailGroup && selFailGroup.getSelectedItem()) {
			// 	selFailGroupCode = selFailGroup.getSelectedItem().getKey();
			// }
			// oHeader.Urgrp = selFailGroupCode;
			// oHeader.Urcod = selFailCodeCode;

			// //Items
			// var itemsData = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
			// var items = [];
			// jQuery.each(itemsData, function(i, item) {
			// 	var cells = item.getCells();
			// 	var status = "";
			// 	for (var j = 0; j < 5; j++) {
			// 		if (cells[8 + j].getSelected()) {
			// 			status = j + 1;
			// 			break;
			// 		}
			// 	}
			// 	items.push({
			// 		Vornr: cells[0].getText(),
			// 		Parconf: cells[1].getSelected(),
			// 		Finconf: cells[2].getSelected(),
			// 		Pernr: cells[4].getText(),
			// 		Comments: cells[6].getText(),
			// 		Status: status.toString()
			// 	});
			// });
			// oHeader.TOITEMS = items;
			// //Call create_deep_entity of OData service
			// var model = this._oView.getModel();
			// this._oView.setBusy(true);
			//
			// model.create("/ORDERLISTSet", oHeader, null, function(oData, response) {
			// 	self._oView.setBusy(false);
			// 	if (oData.Error === "X") {
			// 		sap.m.MessageBox.show(oData.Message, {
			// 			icon: sap.m.MessageBox.Icon.ERROR,
			// 			title: self._oResourceBundle.getText("titleOrderNumber") + " " + oData.Aufnr,
			// 			actions: [sap.m.MessageBox.Action.OK],
			// 			onClose: function() {}
			// 		});
			// 	} else {
			// 		var oSortedData = self._oComponent.getModel().getProperty(self._sItemPath);
			// 		oSortedData.Takeover = "X";
			// 		oSortedData.TakPernr = oData.TakPernr;
			// 		oSortedData.TakDate = oData.TakDate;
			// 		oSortedData.TakTime = oData.TakTime;

			// 		self._oComponent.getModel().setProperty(self._sItemPath, oSortedData);

			// 		self.byId("btn_priseEnCharge").setIcon("sap-icon://accept");
			// 		self.byId("btn_priseEnCharge").setType("Accept");

			// 		sap.m.MessageBox.show(self._oResourceBundle.getText("msgOrdreConfirmed"), {
			// 			icon: sap.m.MessageBox.Icon.SUCCESS,
			// 			title: self._oResourceBundle.getText("titleOrderNumber") + " " + oData.Aufnr,
			// 			actions: [sap.m.MessageBox.Action.OK],
			// 			onClose: function(oAction) {
			// 				self.onQuitter("confirmed");
			// 			}
			// 		});
			// 	}
			// }, function(oError) {
			// 	self._oView.setBusy(false);
			// 	sap.m.MessageBox.error(self._oResourceBundle.getText("msgEchecConfirmation") + oError);
			// });
		},

		onItemSelect: function(oEvent) {
			//var selectedData = oEvent.getSource().getBindingContext().getObject();
			//sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentaire").setValue("");
			sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "addEditItemDialog").setModel(this.getView().getModel("orderitem"));
			//	sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemComments").setBindingContext(oEvent.getSource().getBindingContextPath());
			sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemComments").bindElement(oEvent.getSource().getBindingContextPath());
			sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemDescription").setValue(oEvent.getSource().getCells()[5].getText());

			var sUvorn = oEvent.getSource().getBindingContext().getObject("Uvorn");
			if (sUvorn) {
				return;
			}
			if (!oEvent.getSource().data("definitive")) {
				if (!this._editItemDialog) {
					this._editItemDialog = sap.ui.xmlfragment(this._frgIdEditItemDialog, "PO_MAINTENANCE.view.fragment.editItem", this);
				}
				sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "cb_intervenant").setSelectedKey(oEvent.getSource().getCells()[4].getText());
				/*	if (this._appType === "C") {
						sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentaire").setValue(oEvent.getSource().getCells()[6].getText());
					} else {
						sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentaire").setValue(oEvent.getSource().getCells()[7].getText());
					}  */

				if (!this._oComponent.getModel("userMode").getProperty("/edit")) {
					sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "cb_intervenant").setEnabled(false);
					sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentaire").setEnabled(false); //JII 5507
				} else {
					sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "cb_intervenant").setEnabled(true);
					sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentaire").setEnabled(true); //JII 5507
				}
				// this._tmpVornr = oEvent.getSource().getCells()[0].getText();
				//	this._tmpVornr = oEvent.getSource().getBindingContext().getObject("Vornr");

				// Start - Sub opreation changes - Nagamani
				//this._tmpVornr = this.getView().getModel("orderitem").getProperty(oEvent.getSource().getBindingContextPath()).Vornr;
				this._tmpVornr = this.getView().getModel("orderitem").getProperty(oEvent.getSource().getBindingContextPath()).Vornr + " " + this.getView()
					.getModel("orderitem").getProperty(oEvent.getSource().getBindingContextPath()).Uvorn;
				//end

				this._itmSrc = oEvent.getSource();

				var self = this;
				setTimeout(function() {
					self._editItemDialog.open();
					var techSelected = self._oView.byId("cb_intervenant").getSelectedKey();
					if (techSelected === '00000000' || techSelected === '') {
						sap.ui.core.Fragment.byId(self._frgIdEditItemDialog, "cb_intervenant").setSelectedKey("");
					} else {
						sap.ui.core.Fragment.byId(self._frgIdEditItemDialog, "cb_intervenant").setSelectedKey(techSelected);
					}
					//sap.ui.core.Fragment.byId(self._frgIdEditItemDialog, "cb_intervenant").setSelectedKey(techSelected);
					//sap.ui.core.Fragment.byId(self._frgIdEditItemDialog, "cb_intervenant").setSelectedKey(self._itmSrc.getCells()[4].getText());
					// sap.ui.core.Fragment.byId(self._frgIdEditItemDialog, "cb_intervenant").setSelectedKey("");
					// A faire ici
					/*	if (self._appType === "C") {
							sap.ui.core.Fragment.byId(self._frgIdEditItemDialog, "itemCommentaire").setValue(self._itmSrc.getCells()[6].getText());
						} else {
							sap.ui.core.Fragment.byId(self._frgIdEditItemDialog, "itemCommentaire").setValue(self._itmSrc.getCells()[7].getText());
						} */
					sap.ui.core.Fragment.byId(self._frgIdEditItemDialog, "itemCommentsTable").getBinding("items").refresh();

				}, 50);
			} else {
				sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "cb_intervenant").setEnabled(false);
				sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentaire").setEnabled(false);
				this._editItemDialog.open();
			}
			sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentaire").setValue("");
			//sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemDescription").setValue("");
		},
		closeDialog: function() {
			if (this._editItemDialog) {
				this._editItemDialog.close();
			}
			if (this._addArticleDialog) {
				this._addArticleDialog.close();
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").setValue();
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputCondition").setValue();
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputStoreLocation").setValue();
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").setValue();
				// sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputSerialNum").setValue();
				//	sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "cbSerialNum").setSelectedKey();
			}
			if (this._searchArticleDialog) {
				this._searchArticleDialog.close();
			}
			if (this._takeOverDialog) {
				this._takeOverDialog.close();
			}
			if (this._confirmDialog) {
				this._confirmDialog.close();
			}
		},
		closeSearchDialog: function() {
			// only closes the search dialog
			if (this._searchArticleDialog) {
				this._searchArticleDialog.close();
			}
		},
		saveItem: function() {
			var self = this;
			var dialogIntervenantKey = sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "cb_intervenant").getSelectedKey();
			if (dialogIntervenantKey == '') {
				sap.m.MessageBox.show(
					this._oResourceBundle.getText("msgFillHeaderTechnician"), {
						icon: sap.m.MessageBox.Icon.ERROR,
						title: this._oResourceBundle.getText("Error"),
						actions: [sap.m.MessageBox.Action.OK]
					});

				// sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "cb_intervenant").setValueState("Error");
				//sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "cb_intervenant").setValueStateText("Please fill header technician to save the comment");
			}
			var dialogIntervenantName = sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "cb_intervenant").getSelectedItem().getText();
			var dialogCommentaire = sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentaire").getValue();
			var itemsData = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
			var dialogDescription = sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemDescription").getValue();
			var keyData;
			for (var i = 0; i < itemsData.length; i++) {
				// added for the sub operation implementation - Nagamani
				keyData = this.getView().getModel("orderitem").getProperty(itemsData[i].getBindingContextPath()).Vornr + " " + this.getView().getModel(
					"orderitem").getProperty(itemsData[i].getBindingContextPath()).Uvorn;
				//end
				if (keyData === this._tmpVornr) {
					//Intervenant
					itemsData[i].getCells()[3].setText(dialogIntervenantName);
					//IntervenantId
					itemsData[i].getCells()[4].setText(dialogIntervenantKey);
					//Commentaire
					if (self._appType === "C") {
						itemsData[i].getCells()[6].setText(dialogCommentaire);
						this.getView().getModel("orderitem").setProperty(sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentsTable").getBindingContext()
							.getPath() + "/newComments", dialogCommentaire);
					} else {
						itemsData[i].getCells()[6].setText(dialogCommentaire);
						this.getView().getModel("orderitem").setProperty(sap.ui.core.Fragment.byId(this._frgIdEditItemDialog, "itemCommentsTable").getBindingContext()
							.getPath() + "/newComments", dialogCommentaire);
					}
					itemsData[i].getCells()[5].setText(dialogDescription);

					var orderSelected = this._sItemPath.split("'")[1];
					var opeSelected = itemsData[i].getCells()[0].getText();
					while (orderSelected.length < 12) {
						orderSelected = "0" + orderSelected;
					}
					while (opeSelected.length < 4) {
						opeSelected = "0" + opeSelected;
					}
					this.saveConfirmationText(orderSelected, opeSelected, dialogCommentaire);
					break;
				}
			}
			this._tmpVornr = null;
			this.closeDialog();

		},

		saveConfirmationText: function(sAufnr, sVornr, sText) {
			var urlParameters = {
				"Aufnr": sAufnr,
				"Vornr": sVornr,
				"Comments": sText
			};
			this.getView().getModel().callFunction("/SaveConfText", // function import name
				{
					method: "GET", // http method
					urlParameters: urlParameters,
					success: function(oData, response) {

					}, // callback function for success
					error: function(oError) {
						// console.log(this._oResourceBundle.getText("consoleReadFail"));
						sap.m.MessageToast.show("No Save");
					}
				}); // callback function for error	

		},

		intervenantSelected: function(oEvent) {
			if (oEvent.getSource().getSelectedKey !== "00000000") {
				oEvent.getSource().setValueState("None");
			}
		},
		inputChanged: function(oEvent) {
			/*if (oEvent.getSource().getValue() !== "") {
				oEvent.getSource().setValueState("None");
			} */

			if (oEvent.getSource().getValue() !== "") {
				oEvent.getSource().setValueState("None");
				if (this._oComponent.getModel("confirmed")) {
					this._oComponent.getModel("confirmed").setProperty("/breakdownTime", oEvent.getSource().getValue());
				}
			}
		},
		//Formatter
		reverseBoolean: function(flag, subitem) {
			if (subitem) {
				return false;
			} else {
				//	if (this.finalConfUserChange) {
				//		return flag;
				//	} else {
				return !flag;
				//	}
			}
		},
		formatBase64: function(attach) {
			// return attach.replace(/AAAA/g,"");
			return attach;
		},
		removeLeadingZeros: function(value) {
			return Number(value);
		},
		removeLeadingP: function(value) {
			if (value.indexOf("P") === 0) {
				return value.substring(1);
			}
			return value;
		},
		/**
		 *@memberOf PO_MAINTENANCE.view.Details
		 */
		onItbSelect: function(oEvent) {
			var sKey = oEvent.getParameter("key");
			this.getView().byId("btnConfirm").setEnabled(true);
			// if (sKey === "stock") {
			// 	this.getView().byId("btnStock").setVisible(true);
			// } else {
			// 	this.getView().byId("btnStock").setVisible(false);
			// }
			//JII-4410
			if (sKey === "IATFCounter") {
				this.getView().byId("btnCalculate").setVisible(true);
				this.getView().byId("btnConfirm").setEnabled(false);
			} else {
				this.getView().byId("btnCalculate").setVisible(false);
			}

			if (sKey === "MaintenanceCounter") {
				this.getView().byId("btnMaintCalculate").setVisible(true);
				this.getView().byId("btnConfirm").setEnabled(false);
			} else {
				this.getView().byId("btnMaintCalculate").setVisible(false);
			}

		},

		onStock: function(oEvent, articleCode, quantity, stockType) {
			if (!this._addArticleDialog) {
				this._addArticleDialog = sap.ui.xmlfragment(this._frgIdAddArticleDialog, "PO_MAINTENANCE.view.fragment.addArticle", this);
				this._oView.addDependent(this._addArticleDialog);
			}

			if (!this._oComponent.getModel("stock")) {
				this._oComponent.setModel(new sap.ui.model.json.JSONModel({
					"date": new Date()
				}), "stock");
			}
			this._addArticleDialog.setModel(this._oComponent.getModel("stock"), "stock");

			//JII-6585 - start
			if (articleCode && quantity) {
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").setValue(articleCode);
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").setValue(quantity);
			}
			//JII-6585 end
			
			if(stockType === "StockOutput") {
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "stockOutputBtn").setVisible(true);
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "stockReturnBtn").setVisible(false);
			} else if(stockType === "StockReturn"){
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "stockReturnBtn").setVisible(true);
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "stockOutputBtn").setVisible(false);
			} else {
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "stockOutputBtn").setVisible(true);
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "stockReturnBtn").setVisible(true);
			}

			this._addArticleDialog.open();
		},
		//JII-4410 tma_navay
		onCalculate: function() {
			// var isError = false;
			var IATFtable = sap.ui.core.Fragment.byId(this._frgIdIatfCounter, "filterIATFCounter");
			//	var itafdata = IATFtable.getModel().oData.IATFCountersSet;
			var itafModel = IATFtable.getModel();
			var itafItems = IATFtable.getItems();
			var data;
			for (var i = 0; i < itafItems.length; i++) {
				data = itafModel.getProperty(itafItems[i].getBindingContextPath());
				if (parseFloat(data.Cntrc) <= parseFloat(data.Mrmax) && parseFloat(data.Cntrc) >= parseFloat(data.Mrmin)) {
					itafItems[i].getCells()[5].setValueState(sap.ui.core.ValueState.None);
					itafItems[i].getCells()[5].setValueStateText("");
				} else {
					itafItems[i].getCells()[5].setValueState(sap.ui.core.ValueState.Error);
					itafItems[i].getCells()[5].setValueStateText("Measurement reading outside the measurement range limits");
					// isError = true;
				}
			}
			// for (var i = 0; i < itafdata.length; i++) {
			// 	if (parseInt(itafdata[i].Cntrc) <= itafdata[i].Mrmax && parseInt(itafdata[i].Cntrc) >= itafdata[i].Mrmin) {
			// 		IATFtable.getItems()[i].getCells()[5].setValueState(sap.ui.core.ValueState.None);
			// 		IATFtable.getItems()[i].getCells()[5].setValueStateText("");
			// 	} else {
			// 		IATFtable.getItems()[i].getCells()[5].setValueState(sap.ui.core.ValueState.Error);
			// 		IATFtable.getItems()[i].getCells()[5].setValueStateText("Measurement reading outside the measurement range limits");
			// 		isError = true;
			// 	}
			// }
			// if (isError) {
			// 	this.getView().byId("btnConfirm").setEnabled(false);
			// } else {
			// 	this.getView().byId("btnConfirm").setEnabled(true);
			// }

			this.getView().byId("btnConfirm").setEnabled(true);

		},

		onMaintCalculate: function() {
			var maintTable = sap.ui.core.Fragment.byId(this._frgIdMaintenanceCounter, "filterMaintCounter");
			var maintModel = maintTable.getModel();
			var maintItems = maintTable.getItems();
			var data;
			for (var i = 0; i < maintItems.length; i++) {
				data = maintModel.getProperty(maintItems[i].getBindingContextPath());
				if (parseInt(data.Cntrc) <= parseInt(data.Cntrr)) {
					maintItems[i].getCells()[4].setValueState(sap.ui.core.ValueState.Error);
					maintItems[i].getCells()[4].setValueStateText("New value can't be less than Actual value");
					this.getView().byId("btnConfirm").setEnabled(false);
					return;
				} else {
					maintItems[i].getCells()[4].setValueState(sap.ui.core.ValueState.None);
					maintItems[i].getCells()[4].setValueStateText("");
				}
			}
			this.getView().byId("btnConfirm").setEnabled(true);
		},

		searchArticle: function() {
			if (!this._searchArticleDialog) {
				this._searchArticleDialog = sap.ui.xmlfragment(this._frgIdSearchArticleDialog,
					"PO_MAINTENANCE.view.fragment.searchArticle", this);
				this._oView.addDependent(this._searchArticleDialog);
			}

			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "storageLocation").setValue(sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog,
				"inputStoreLocation").getValue());
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "material").setValue(sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog,
				"inputArticle").getValue());

			this.performSearch();

			this._searchArticleDialog.open();
		},
		onScanArticle: function() {
			var self = this;
			cordova.plugins.barcodeScanner.scan(
				function(result) {
					var matnr = result.text;
					var pattern = new RegExp("^[A-Za-z0-9]{1,18}$");
					if (!pattern.test(matnr)) {
						sap.m.MessageToast.show(this._oResourceBundle.getText("msgErreurNumArticle"));
						return;
					}
					// self.getView().getModel().read("/GOODS_ISSUESet(Aufnr='',Matnr='" + matnr + "')", null, null, true, function(oData) {
					// 	if (oData.Maktx === "") {
					// 		sap.m.MessageBox.show(
					// 			this._oResourceBundle.getText("msgArticleNotFound"), {
					// 				icon: sap.m.MessageBox.Icon.ERROR,
					// 				title: this._oResourceBundle.getText("msgErreur"),
					// 				actions: [sap.m.MessageBox.Action.OK],
					// 				onClose: function() {}
					// 			});
					// 	} else {

					// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "articleDesc").setText(oData.Maktx);
					// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputQty").setPlaceholder(oData.Quantity + " " + oData.Meins + " " +
					// 			this._oRessourceBundle.getText("placeHolderQty"));
					// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "qtyUnit").setText(oData.Meins);
					// 	}
					// 	sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputArticle").setValue(matnr);
					// }, function() {
					// 	console.log(this._oResourceBundle.getText("consoleReadFail"));
					// });

					self.getView().getModel().callFunction("/GetMatStock", // function import name
						"GET", // http method
						{
							"Matnr": matnr
						}, // function import parameters
						null,
						function(oData, response) {
							if (oData.Maktx === "") {
								sap.m.MessageBox.show(
									this._oResourceBundle.getText("msgArticleNotFound"), {
										icon: sap.m.MessageBox.Icon.ERROR,
										title: this._oResourceBundle.getText("msgErreur"),
										actions: [sap.m.MessageBox.Action.OK],
										onClose: function() {}
									});
							} else {

								sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "articleDesc").setText(oData.Maktx);
								sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputQty").setPlaceholder(oData.Quantity + " " + oData.Meins + " " +
									this._oRessourceBundle.getText("placeHolderQty"));
								sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "qtyUnit").setText(oData.Meins);
							}
							sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputArticle").setValue(matnr);
						}, // callback function for success
						function(oError) {
							// console.log(this._oResourceBundle.getText("consoleReadFail"));
						}); // callback function for error

					self.readSerialNumbers(matnr);

				},
				function(error) {
					alert(this._oResourceBundle.getText("alertScan") + error);
				}
			);
		},

		readSerialNumbers: function(sMatnr) {
			var self = this;
			var sMat;
			var sPrefix = sMatnr.charAt(0);
			if (sPrefix === "P") {
				sMat = sMatnr.substring(1, sMatnr.length);
			}
			this.getView().getModel().read("/SERIAL_NUMSet", {
				filters: [new sap.ui.model.Filter("Matnr", "EQ", sMat)],
				success: function(oData) {
					// if (oData.results.length > 0) {
					// 	// sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputSerialNum").setEnabled(true);
					// 	sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "cbSerialNum").setEnabled(true);
					// } else {
					// 	// sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputSerialNum").setEnabled(false);
					// 	sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "cbSerialNum").setEnabled(false);
					// }
					self.getOwnerComponent().getModel("serialNumber").setData(oData);
				},
				error: function(oError) {

				}
			});
		},

		onSearchArticle: function(oEvent) {
			var self = this;
			var matnr = oEvent.getSource().getValue();
			var pattern = new RegExp("^[A-Za-z0-9]{1,18}$");
			if (!pattern.test(matnr)) {
				sap.m.MessageToast.show(this._oResourceBundle.getText("messageNotValidArticle"));
				return;
			}
			// this.getView().getModel().read("/GOODS_ISSUESet(Aufnr='',Matnr='" + matnr + "')", null, null, true, function(oData) {
			// 	if (oData.Maktx === "") {
			// 		sap.m.MessageBox.show(
			// 			this._oResourceBundle.getText("msgArticleNotFound"), {
			// 				icon: sap.m.MessageBox.Icon.ERROR,
			// 				title: this._oResourceBundle.getText("msgErreur"),
			// 				actions: [sap.m.MessageBox.Action.OK],
			// 				onClose: function() {}
			// 			}
			// 		);
			// 	} else {
			// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "articleDesc").setText(oData.Maktx);
			// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputQty").setPlaceholder(oData.Quantity + " " + oData.Meins + " " + self._oResourceBundle
			// 			.getText("en stock"));
			// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "qtyUnit").setText(oData.Meins);
			// 	}
			// 	sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputArticle").setValue(matnr);
			// }, function() {
			// 	console.log(this._oResourceBundle.getText("consoleReadFail"));
			// });
			this.getView().getModel().callFunction("/GetMatStock", // function import name
				"GET", // http method
				{
					"Matnr": matnr
				}, // function import parameters
				null,
				function(oData) {
					if (oData.Maktx === "") {
						sap.m.MessageBox.show(
							this._oResourceBundle.getText("msgArticleNotFound"), {
								icon: sap.m.MessageBox.Icon.ERROR,
								title: this._oResourceBundle.getText("msgErreur"),
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function() {}
							});
					} else {

						sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "articleDesc").setText(oData.Maktx);
						sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputQty").setPlaceholder(oData.Quantity + " " + oData.Meins + " " +
							this._oRessourceBundle.getText("placeHolderQty"));
						sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "qtyUnit").setText(oData.Meins);
					}
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputArticle").setValue(matnr);
				}, // callback function for success
				function(oError) {
					// console.log(this._oResourceBundle.getText("consoleReadFail"));
				}); // callback function for error
		},
		onScanSerialNum: function() {
			var self = this;
			cordova.plugins.barcodeScanner.scan(
				function(result) {
					var sernr = result.text;
					var pattern = new RegExp("^[A-Za-z0-9]{1,18}$");
					if (!pattern.test(sernr)) {
						sap.m.MessageToast.show(this._oResourceBundle.getText("msgErreurNumArticle"));
						return;
					}
					// sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputSerialNum").setText(sernr);
					// self.getView().getModel().read("/GOODS_ISSUESet(Aufnr='',Matnr='" + matnr + "')", null, null, true, function(oData) {
					// 	if (oData.Maktx === "") {
					// 		sap.m.MessageBox.show(
					// 			this._oResourceBundle.getText("msgArticleNotFound"), {
					// 				icon: sap.m.MessageBox.Icon.ERROR,
					// 				title: this._oResourceBundle.getText("msgErreur"),
					// 				actions: [sap.m.MessageBox.Action.OK],
					// 				onClose: function() {}
					// 			});
					// 	} else {
					// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "articleDesc").setText(oData.Maktx);
					// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputQty").setPlaceholder(oData.Quantity + " " + oData.Meins + " " +
					// 			this._oRessourceBundle.getText("placeHolderQty"));
					// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "qtyUnit").setText(oData.Meins);
					// 	}
					// 	sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputArticle").setValue(matnr);
					// }, function() {
					// 	console.log(this._oResourceBundle.getText("consoleReadFail"));
					// });
				},
				function(error) {
					alert(this._oResourceBundle.getText("alertScan") + error);
				}
			);
		},
		onSearchSerialNumber: function(oEvent) {
			var self = this;
			var sernr = oEvent.getSource().getValue();
			var pattern = new RegExp("^[A-Za-z0-9]{1,18}$");
			if (!pattern.test(sernr)) {
				sap.m.MessageToast.show(this._oResourceBundle.getText("messageNotValidSerial"));
				return;
			}
			// this.getView().getModel().read("/STORAGE_LOCSet", {
			// 	filters: [new sap.ui.model.Filter("Lgort", "Contains", )]
			// 	success: function(oData) {
			// 		if (oData.Maktx === "") {
			// 			sap.m.MessageBox.show(
			// 				this._oResourceBundle.getText("msgArticleNotFound"), {
			// 					icon: sap.m.MessageBox.Icon.ERROR,
			// 					title: this._oResourceBundle.getText("msgErreur"),
			// 					actions: [sap.m.MessageBox.Action.OK],
			// 					onClose: function() {}
			// 				}
			// 			);
			// 		} else {
			// 			sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "articleDesc").setText(oData.Maktx);
			// 			sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputQty").setPlaceholder(oData.Quantity + " " + oData.Meins + " " +
			// 				self._oResourceBundle
			// 				.getText("en stock"));
			// 			sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "qtyUnit").setText(oData.Meins);
			// 		}
			// 		sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputArticle").setValue(matnr);
			// 	},
			// 	error: function() {
			// 		console.log(this._oResourceBundle.getText("consoleReadFail"));
			// 	}
			// });
		},

		onStorageLocationSearch: function(oEvent) {
			oEvent.getSource().getBinding("items").filter([
				new sap.ui.model.Filter("Lgort", "EQ", oEvent.getParameter("value"))
			]);
		},

		saveArticle: function(oEvent) {
			var self = this;
			var oElement = {};

			var oButton = oEvent.getSource();

			// Read custom data using key
			var sReturns = oButton.data("Returns");

			// if (sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputSerialNum").getEnabled() && !sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog,
			// 		"inputSerialNum").getValue()) {
			// 	return sap.m.MessageToast.show(this._oResourceBundle.getText("serialNumMandatory"));
			// }
			// if (sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "cbSerialNum").getEnabled() && !sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog,
			// 		"cbSerialNum").getSelectedKey()) {
			// 	return sap.m.MessageToast.show(this._oResourceBundle.getText("serialNumMandatory"));
			// }
			sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").setValueState("None");
			oElement.Aufnr = this._sItemPath.split("'")[1];
			oElement.Matnr = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").getValue();
			oElement.Quantity = parseInt(sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").getValue(), 10);
			oElement.Budat = this._oComponent.getModel("stock").getProperty("/date");
			oElement.Lgort = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputStoreLocation").getValue();
			oElement.Returns = sReturns;
			oElement.Bwtar = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputCondition").getValue();

			// if (sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputSerialNum").getEnabled()) {
			// 	oElement.Sernr = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputSerialNum").getValue();
			// }
			// if (sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "cbSerialNum").getEnabled()) {
			// 	oElement.Sernr = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "cbSerialNum").getSelectedKey();
			// }
			
			if (!oElement.Quantity || oElement.Quantity <= 0) {
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").setValueState("Error");
				return;
			}
			this.getView().getModel("orderitem").create("/GOODS_ISSUESet", oElement, {
				success: function(oData) {
					sap.m.MessageBox.show(
						oData.Message, {
							icon: sap.m.MessageBox.Icon.INFORMATION,
							title: self._oResourceBundle.getText("messageBoxTitleResult"),
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function() {}
						}
					);
					self._addArticleDialog.close();
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputArticle").setValue();
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "articleDesc").setText();
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputQty").setPlaceholder();
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "qtyUnit").setText();
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputQty").setValue();
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputCondition").setValue();
					//	this._oComponent.getModel("stock").setProperty("/date", new Date());
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputStoreLocation").setValue();
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "storageLocationDesc").setText();
					// sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputSerialNum").setValue();
					// sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputSerialNum").setEnabled(false);
					// sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "cbSerialNum").setSelectedKey();
					// sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "cbSerialNum").setEnabled(false);
				},
				error: function(oError) {

				}
			});
		},

		onStorageLocVH: function() {
			if (!this._storageLocDialog) {
				this._storageLocDialog = sap.ui.xmlfragment(this._frgIdStorageLocationDialog,
					"PO_MAINTENANCE.view.fragment.storageLocation", this);
				this._oView.addDependent(this._storageLocDialog);
			}
			//JII-6585
			var articleCode = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").getValue();
			var oBinding = sap.ui.core.Fragment.byId(this._frgIdStorageLocationDialog, "storageLocDlg").getBinding("items");

			if (articleCode !== "") {

				oBinding.filter([new Filter(
					"Matnr",
					FilterOperator.EQ,
					articleCode
				)]);
			} else {
				oBinding.filter([]);
			}
			this._storageLocDialog.open();
		},

		handleStorageLocationClose: function(oEvent) {
			var sSelectedKey = oEvent.getParameter("selectedItem").getDescription();
			if (this._searchArticleDialog && this._searchArticleDialog.isOpen()) {
				sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "storageLocation").setValue(sSelectedKey);
			} else {
				sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputStoreLocation").setValue(sSelectedKey);
			}
		},

		onUploadComplete: function(oEvent) {
			var status = oEvent.getParameter("status");
			this.getView().getModel().refresh(true);
		},

		onBeforeUploadStarts: function() {},
		onChange: function(oEvent) {
			var slug = oEvent.getParameters().files[0].name + "/" + this.aufnr;
			// Header Token
			this.getView().getModel().refreshSecurityToken();
			var oCustomerHeaderToken = new sap.m.UploadCollectionParameter({
				name: "x-csrf-token",
				value: this.getView().getModel().getHeaders()['x-csrf-token'] // this._token //"securityTokenFromModel"
			});
			var oCustomerHeaderSlug = new sap.m.UploadCollectionParameter({
				name: "slug",
				value: slug
			});
			oEvent.getSource().addHeaderParameter(oCustomerHeaderToken);
			oEvent.getSource().addHeaderParameter(oCustomerHeaderSlug);
		},

		onFileDeleted: function(oEvent) {
			var sDocumentId = oEvent.getParameter("documentId");
			var documentText = oEvent.getParameters().item.getProperty("fileName");
			var model = this.getView().getModel();
			model.remove("/ATTACHSet(Tplnr='',Equnr='',Dktxt='" + documentText + "',Aufnr='" + this.aufnr + "',DocNum='" + sDocumentId + "')", {
				success: function() {
					this.getView().getModel().refresh(true);
				}.bind(this)
			});

			// oEvent.getSource().rerender();
		},
		getUploadToken: function(callback) {
			var self = this;
			OData.request({
					requestUri: window.location.origin + "/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/ORDERLISTSet",
					method: "GET",
					headers: {
						"X-Requested-With": "XMLHttpsRequest",
						"Content-Type": "application/xml;charset=utf-8",
						"DataServiceVersion": "2.0",
						"X-CSRF-Token": "Fetch"
					}
				},
				function(data, response) {
					callback(response.headers["x-csrf-token"]);
				}
			);

			function callback(token) {
				self._token = token;
			}
		},
		handleWorkTypeChange: function(oEvent) {
			/*alert("Elément choisi: '" + oEvent.getParameter("selectedItem").getText() + "'");*/
			this.getView().byId("cb_group").setEnabled(true);
		},
		resetSearch: function() {
			var filters = [];
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "table").getBinding("items").filter(filters);
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "storageLocation").setValue("");
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "material").setValue("");
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "materialDesc").setValue("");
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "manfPart").setValue("");
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "manf").setValue("");
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "oldPartNum").setValue("");
		},
		performSearch: function() {
			// Filter table by user input
			var storageLoc = sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "storageLocation");
			var codeArticle = sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "material");
			var descArticle = sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "materialDesc");
			var manfPartN = sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "manfPart");
			var manfRef = sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "manf");
			var oldPartNum = sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "oldPartNum");
			var condition = sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "condition");
			var filters = [];
			if (storageLoc.getValue() !== "") {
				filters.push(new sap.ui.model.Filter("Lgort", sap.ui.model.FilterOperator.EQ, storageLoc.getValue()));
			}
			if (codeArticle.getValue() !== "") {
				filters.push(new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, codeArticle.getValue()));
			}
			if (descArticle.getValue() !== "") {
				filters.push(new sap.ui.model.Filter("Maktx", sap.ui.model.FilterOperator.EQ, descArticle.getValue()));
			}
			if (manfPartN.getValue() !== "") {
				filters.push(new sap.ui.model.Filter("ZMfrpn", sap.ui.model.FilterOperator.EQ, manfPartN.getValue()));
			}
			if (manfRef.getValue() !== "") {
				filters.push(new sap.ui.model.Filter("ZMfrnr", sap.ui.model.FilterOperator.EQ, manfRef.getValue()));
			}
			if (oldPartNum.getValue() !== "") {
				filters.push(new sap.ui.model.Filter("ZzOldMatnr", sap.ui.model.FilterOperator.EQ, oldPartNum.getValue()));
			}
			if (condition.getValue() !== "") {
				filters.push(new sap.ui.model.Filter("Bwtar", sap.ui.model.FilterOperator.EQ, condition.getValue()));
			}
			sap.ui.core.Fragment.byId(this._frgIdSearchArticleDialog, "table").getBinding("items").filter(filters);
		},
		onPress: function(oEvent) {
			var codeArticle = oEvent.getSource().getBindingContext().getObject().Matnr;
			var storageLoc = oEvent.getSource().getBindingContext().getObject().Lgort;
			var condition = oEvent.getSource().getBindingContext().getObject().Bwtar;
		//	var quantity = oEvent.getSource().getBindingContext().getObject().Labst;
			sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").setValue(codeArticle);
			sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").fireChange();
			sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputStoreLocation").setValue(storageLoc);
			sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputStoreLocation").fireChange();
			sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputCondition").setValue(condition);
		//	sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").setValue(quantity);
			this.readSerialNumbers(codeArticle);
			this.closeSearchDialog();
		},
		//JII 4410 RAGOW
		onFunctionCatChange: function(oEvent) {
			//	debugger;
			var sValue = oEvent.getParameter("selectedItem").getKey();
			var oCatFunction = this.getView().byId("cb_FunCode");
			oCatFunction.setSelectedKey();
			oCatFunction.setEnabled(true);
			oCatFunction.getBinding("items").filter(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, sValue));
		},
		handleWorkGroupChange: function(oEvent) {
			this.getView().byId("cb_failcode").setEnabled(true);
			this.getView().byId("cb_failcode").setSelectedItem(null);
			var selectedKey = oEvent.getParameter("selectedItem").getKey();
			var filters = [];
			filters.push(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, selectedKey));
			this.getView().byId("cb_failcode").getBinding("items").filter(filters);
		},
		handleCauseGroupChange: function(oEvent) {
			this.getView().byId("cb_causecode").setEnabled(true);
			this.getView().byId("cb_causecode").setSelectedItem(null);
			var selectedKey = oEvent.getParameter("selectedItem").getKey();
			var filters = [];
			filters.push(new sap.ui.model.Filter("Codegruppe", sap.ui.model.FilterOperator.EQ, selectedKey));
			this.getView().byId("cb_causecode").getBinding("items").filter(filters);
		},

		/* ******************************************************************************************
		 * Evolution
		 * *****************************************************************************************/
		// Prise en charge - Evol&nbsp;
		onTakeOverBtnPress: function(oEvent) {
			if (!this._takeOverDialog) {
				this._frgIdTakeOverDialog = this._oView.getId() + "-takeOverDialog";
				this._takeOverDialog = sap.ui.xmlfragment(this._frgIdTakeOverDialog, "PO_MAINTENANCE.view.fragment.PriseEnCharge", this);
				this._oView.addDependent(this._takeOverDialog);
			}

			if (!this._oComponent.getModel("takeOver")) {
				this._oComponent.setModel(new sap.ui.model.json.JSONModel(), "takeOver");
				this._oComponent.getModel("takeOver").setData({
					"technician": "",
					"date": new Date(),
					"enabled": true
				});

			}

			this._oComponent.getModel("takeOver").setProperty("/enabled", true);

			var oData = this._oComponent.getModel().getProperty(this._sItemPath);
			if (oData.Status === 'A') {
				// var seconds = 0;
				// seconds += oData.TakTime.substr(0,2) * 3600;
				// seconds += oData.TakTime.substr(2,2) * 60;
				// seconds += oData.TakTime.substr(4,2);
				oData.TakDate.setHours(oData.TakTime.substr(0, 2));
				oData.TakDate.setMinutes(oData.TakTime.substr(2, 2));
				oData.TakDate.setSeconds(oData.TakTime.substr(4, 2));
				// oData.TakDate.setSeconds(seconds);
				if (!oData.TakPernr || oData.TakPernr === "00000000") {
					this._oComponent.getModel("takeOver").setData({
						"technician": "",
						"date": this.formatDate(oData.TakDate),
						"enabled": true
					});
				} else {
					this._oComponent.getModel("takeOver").setData({
						"technician": oData.TakPernr,
						"date": this.formatDate(oData.TakDate),
						"enabled": false
					});
				}
			} else {
				if (!oData.TakPernr || oData.TakPernr === "00000000") {
					this._oComponent.getModel("takeOver").setData({
						"technician": "",
						"date": new Date(),
						"enabled": true
					});
				} else {
					this._oComponent.getModel("takeOver").setData({
						"technician": oData.TakPernr,
						"date": new Date(),
						"enabled": true
					});
				}

			}
			this._oComponent.getModel("takeOver").updateBindings(true);
			this._takeOverDialog.setModel(this._oComponent.getModel("takeOver"), "takeOver");
			this._takeOverDialog.setModel(this._oComponent.getModel());
			this._takeOverDialog.getModel("takeOver").updateBindings(true);

			// oData.Takeover = "X";
			// this._oComponent.getModel().setProperty(this._sItemPath, oData);
			var self = this;
			setTimeout(function() {
				self._takeOverDialog.open();
				self._takeOverDialog.getModel("takeOver").updateBindings(true);
			}, 50);
			// this._takeOverDialog.open();
		},

		onTechTakeOverChange: function(oEvent) {
			this._sTakName = oEvent.getParameter("selectedItem").getText();

		},

		takeOverOrder: function() {
			var oModel = this._oComponent.getModel("takeOver");
			var oData = oModel.getData();

			if (oData.technician === "" || !oData.date) {
				return sap.m.MessageToast.show("Prise en charge non affectée");
			}

			var orderSelected = this._sItemPath.split("'")[1];
			var time = this.formatTime(oData.date);
			// this._sTakName = oEvent.getParameter("selectedItem");

			var oEntry = {
				"Aufnr": orderSelected,
				"Pernr": oData.technician,
				"Date": oData.date,
				"Time": time
			};

			var self = this;

			this._oComponent.getModel().create("/TAKEOVERSet", oEntry, {
				success: function(oData2) {
					if (oData2.Error !== "") {
						return sap.m.MessageToast.show(oData2.Message);
					}
					var oSortedData = self._oComponent.getModel().getProperty(self._sItemPath);
					oSortedData.Takeover = "X";
					oSortedData.TakPernr = oData2.Pernr;
					oSortedData.Pernr = oData2.Pernr;
					oSortedData.TakDate = oData2.Date;
					oSortedData.TakTime = oData2.Time;
					oSortedData.TakName = self._sTakName;

					self._oComponent.getModel().setProperty(self._sItemPath, oSortedData);
					self._oComponent.getModel().updateBindings(true);

					// self.byId("btn_priseEnCharge").setIcon("sap-icon://accept");
					// self.byId("btn_priseEnCharge").setType("Accept");

					sap.ui.core.Fragment.byId(self._frgIdItems, "tableItems").getBinding("items").refresh();

					self.closeDialog();
				},
				error: function(oError) {
					sap.m.MessageToast.show("Prise en charge non affectée");
					// self.closeDialog();
				}
			});

		},

		formatTime: function(oDate) {
			var hours = oDate.getHours();
			var minutes = oDate.getMinutes();
			var seconds = oDate.getSeconds();
			return "" +
				((hours < 10) ? "0" + hours : hours) +
				((minutes < 10) ? "0" + minutes : minutes) +
				((seconds < 10) ? "0" + seconds : seconds);
		},

		// Popup de confirmation Temps d'arret - Evol
		onCheckConfirmed: function() {
			this.onConfirmed();
		},

		onCheckImpactToPokaYokes: function() {
			this._bPokayokes = "";
			this._bSafety = "";
			var sMessage = this._oComponent.getModel("i18n").getResourceBundle().getText("textPokayokeQuestion");
			this.openMessageBox(sMessage, false, this.fillPokaYokesId.bind(this), this.checkImpactToSafety.bind(this));
		},
		fillPokaYokesId: function() {
			var oLayout = sap.ui.xmlfragment("PO_MAINTENANCE.view.fragment.addPokayokeCode", this);
			oLayout.setModel(this._oComponent.getModel("PokayokeModel"), "PokayokeModel");
			var oView = this.getView();
			oView.addDependent(oLayout);
			this.openMessageBox(oLayout, true, this.checkPokayokesEntry.bind(this));
		},
		checkPokayokesEntry: function() {
			if (!this._oComponent.getModel("PokayokeModel").getProperty("/PokayokeIDCode")) {
				this.fillPokaYokesId();
			} else {
				this.checkValidPokaYokes();
			}
		},
		checkValidPokaYokes: function() {
			// var sMessage = "Did I validate the pokayoke  ?";
			var sMessage = this._oComponent.getModel("i18n").getResourceBundle().getText("textPokayokeValidation");
			this.openMessageBox(sMessage, true, this.onValidPokaYokes.bind(this));
		},
		onValidPokaYokes: function() {
			// this._oView.byId("cb_pokayokes").setSelected("true");
			this._bPokayokes = "X";
			this.checkImpactToSafety();
		},
		checkImpactToSafety: function() {
			// var sMessage = "Did you impact safety?";
			var sMessage = this._oComponent.getModel("i18n").getResourceBundle().getText("textSafetyQuestion");
			this.openMessageBox(sMessage, false, this.checkSafety.bind(this), this.checkBeforeSave.bind(this));
		},
		checkSafety: function() {
			// var sMessage = "Did I validate the safety device?";
			var sMessage = this._oComponent.getModel("i18n").getResourceBundle().getText("textSafetyValidation");
			this.openMessageBox(sMessage, true, this.onValidSafety.bind(this));
		},
		onValidSafety: function() {
			// this._oView.byId("cb_safety").setSelected("true");
			this._bSafety = "X";
			this.checkBeforeSave();
		},

		checkBeforeSave: function() {
			// if (this._bSafety === "X" || this._bPokayokes === "X") {
			this.onSaveItems();
			// } else {
			// 	sap.m.MessageToast.show("Save cancelled. Please validate Safety or pokayokes");
			// }
		},
		onValidOrders: function() {
			//this.onSaveItems();
			if (this._appType === "C") {
				if (!this._confirmDialog) {
					this._frgIdConfirmDialog = this._oView.getId() + "-confirmDialog";
					this._confirmDialog = sap.ui.xmlfragment(this._frgIdConfirmDialog, "PO_MAINTENANCE.view.fragment.ConfirmDialog", this);
					this._oView.addDependent(this._confirmDialog);
				}

				var breakdownTime = this.getView().byId("num_tempsArret").getValue();
				if (!this._oComponent.getModel("confirmed")) {
					this._oComponent.setModel(new sap.ui.model.json.JSONModel(), "confirmed");
				}

				this._oComponent.getModel("confirmed").setData({
					"breakdownTime": breakdownTime
				});

				this._confirmDialog.setModel(this._oComponent.getModel("confirmed"), "confirmed");

				this._confirmDialog.open();
			} else {
				// if (this.isFinalConf()) {
				// 	this.onCheckImpactToPokaYokes();
				// } else {
				this.onSaveItems();
				// }
			}
			// else {
			// 	this.onConfirmed();
			// }
		},

		isFinalConf: function() {
			var itemsCheck = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
			var confModified = false;
			var finalConf = false;
			itemsCheck.forEach(function(item) {
				var cells = item.getCells();
				var enabled1 = cells[1].getEnabled();
				var enabled2 = cells[2].getEnabled();
				if (!(enabled1 && enabled2)) {
					return false;
				}
				var parconf = cells[1].getSelected();
				var finconf = cells[2].getSelected();
				if (parconf | finconf) {
					confModified = true;
					if (finconf) {
						finalConf = true;
					}
				}
			});

			return finalConf;
		},

		openMessageBox: function(sMessage, bNoActionNo, fOk, fNo) {
			var self = this;
			var confirm = this._oComponent.getModel("i18n").getResourceBundle().getText("textBtnConfirmed");
			// this.getRessourceBundle("").getText();
			var aActions;
			if (bNoActionNo) {
				aActions = [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.CANCEL];
			} else {
				aActions = [sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO, sap.m.MessageBox.Action.CANCEL];
			}

			sap.m.MessageBox.show(sMessage, {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: confirm,
				actions: aActions,
				onClose: function(oAction) {
					switch (oAction) {
						case sap.m.MessageBox.Action.YES:
							fOk();
							self.closeDialog();
							break;
						case sap.m.MessageBox.Action.NO:
							fNo();
							self.closeDialog();
							break;
						case sap.m.MessageBox.Action.CANCEL:
							self.closeDialog();
							break;
					}
				}
			});
		},

		onSaveItems: function() {
			var self = this;
			var headerIntervenant = this._oView.byId("cb_intervenant");
			var headerTotalTime = this._oView.byId("num_tempsTotalIntervention");
			var headerStopTime = this._oView.byId("num_tempsArret");
			//Header
			var oHeader = {};
			oHeader.Aufnr = this._sItemPath.split("'")[1];
			oHeader.Description = this._oView.byId("txt_description").getValue();
			oHeader.Conftime = headerTotalTime.getValue();
			oHeader.Eauszt = headerStopTime.getValue();
			if (this._oComponent.getModel("confirmed")) {
				oHeader.Eauszt = this._oComponent.getModel("confirmed").getProperty("/breakdownTime");
			} else {
				oHeader.Eauszt = headerStopTime.getValue();
			}
			if (!oHeader.Eauszt) {
				oHeader.Eauszt = "0";
			}
			oHeader.Pernr = headerIntervenant.getSelectedKey();
			if (!oHeader.Pernr || oHeader.Pernr === "00000000") {
				oHeader.Pernr = this._oView.getModel().getProperty(self._sItemPath + "/Pernr");
			}

			// self.CheckImpactToPokaYokes();

			// oHeader.Pokayokes = this._oView.byId("cb_pokayokes").getSelected() ? "X" : "";
			// oHeader.Safety = this._oView.byId("cb_safety").getSelected() ? "X" : "";

			oHeader.Pokayokes = this._bPokayokes;
			oHeader.Safety = this._bSafety;

			//JII 3786 - Start TMA_NAVAY
			// var ogetDateValue = this._oView.byId("breakdownstartdateid").getValue();
			var ogetDateValue = this.getView().getModel().getProperty(self._sItemPath + "/Ausvn");

			//4190 Start

			//var notifDateValue = this._oView.byId("notiffailuredateid").getValue();
			var notifDateValue = this.getView().getModel().getProperty(self._sItemPath + "/Notifdate");
			// 	activityDateValue = this._oView.byId("activitydateid").getValue();
			var activityDateValue = this.getView().getModel().getProperty(self._sItemPath + "/ActivityStartdate");

			if (activityDateValue === "" || activityDateValue === undefined || activityDateValue === null) {
				if (this.countAD > 0 || this.countADFuture > 0 || this.countADPast > 0) {
					var DateValue = this._oView.byId("activitydateid").getValue();
					var datearray = DateValue.split(".");
					activityDateValue = datearray[1] + '/' + datearray[0] + '/' + datearray[2];
				} else {
					activityDateValue = new Date();
				}
			}
			// var activityDateValue = this.getView().getModel().getProperty(self._sItemPath + "/ActivityStartdate");
			// var currentdate = new Date();
			// if(activityDateValue !== currentdate){
			// 	activityDateValue = this._oView.byId("activitydateid").getValue();
			// }
			// var	dateFormat1 = sap.ui.core.format.DateFormat.getDateInstance({
			// 		pattern: "MM.dd.yyyy"
			// 	});
			// if (activityDateValue === "" || activityDateValue === undefined || activityDateValue === null) {
			// 	var activityDateValue  = new Date();
			// //activityDateValue=	this.getView().byId("activitydateid").getValue(dateFormat.format(currentDate));
			// // var DateValue = this._oView.byId("activitydateid").getValue();
			// // activityDateValue = dateFormat1.format(new Date(DateValue));
			// 	} 
			//Functional Location Value help
			oHeader.Tplnr = this._oView.byId("txt_posteTechnique").getValue().split(" - ")[0];
			oHeader.Equnr = this._oView.byId("txt_equipement").getValue().split(" - ")[0];

			if (this._appType == "C") {
				oHeader.Ausvn = this.oDateConvert(ogetDateValue);
				oHeader.Auztv = this._oView.byId("breakdownstarttimeid")._getInputValue();

				//	oHeader.Notifdate = this.oDateConvert(notifDateValue);
				//	oHeader.Notiftime = this._oView.byId("notiffailuretimeid")._getInputValue();

				oHeader.ActivityStartdate = this.oDateConvert(activityDateValue);
				oHeader.ActivityStarttime = this._oView.byId("activitytimeid")._getInputValue();

				//4190 End

			}
			//JII 3786- end

			//JII 3786
			var oItemData = this._oComponent.getModel().getProperty(this._sItemPath);
			oHeader.Takeover = oItemData.Takeover;
			oHeader.TakPernr = oItemData.TakPernr;
			oHeader.TakDate = oItemData.TakDate;
			oHeader.TakTime = oItemData.TakTime;

			var selFailCode = this._oView.byId("cb_failcode");
			var selFailCodeCode;
			if (selFailCode && selFailCode.getSelectedItem()) {
				selFailCodeCode = selFailCode.getSelectedItem().getKey();
			}
			var selFailGroup = this._oView.byId("cb_fail");
			var selFailGroupCode;
			if (selFailGroup && selFailGroup.getSelectedItem()) {
				selFailGroupCode = selFailGroup.getSelectedItem().getKey();
			}
			oHeader.Fegrp = selFailGroupCode;
			oHeader.Fecod = selFailCodeCode;

			var selCause = this._oView.byId("cb_cause");
			var selCauseValue;
			if (selCause && selCause.getSelectedItem()) {
				selCauseValue = selCause.getSelectedItem().getKey();
			}
			var selCauseCode = this._oView.byId("cb_causecode");
			var selCauseCodeValue;
			if (selCauseCode && selCauseCode.getSelectedItem()) {
				selCauseCodeValue = selCauseCode.getSelectedItem().getKey();
			}
			oHeader.Urgrp = selCauseValue;
			oHeader.Urcod = selCauseCodeValue;

			//JII 4410 start func cat &S cat code
			var selFunction = this._oView.byId("cb_CatFunc");
			var selFunctionValue;
			if (selFunction && selFunction.getSelectedItem()) {
				selFunctionValue = selFunction.getSelectedItem().getKey();
			}
			var selFunctionCode = this._oView.byId("cb_FunCode");
			var selFunctioneCodeValue;
			if (selFunctionCode && selFunctionCode.getSelectedItem()) {
				selFunctioneCodeValue = selFunctionCode.getSelectedItem().getKey();
			}
			oHeader.Function = selFunctionValue;
			oHeader.FunctionCode = selFunctioneCodeValue;
			//4410 end

			//Items
			var itemsData = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
			var items = [];
			var baseComments = "";
			if (oHeader.Pokayokes === "X") {
				baseComments = "PokayokeID: " + this._oComponent.getModel("PokayokeModel").getProperty("/PokayokeIDCode") + "\n";
			}
			jQuery.each(itemsData, function(i, item) {
				//var itemData = item.getBindingContext().getObject();
				var itemData = self.getView().getModel("orderitem").getProperty(item.getBindingContextPath());
				var cells = item.getCells();
				// var status = "";
				// for (var j = 0; j < 5; j++) {
				// 	if (self._appType === "C") {
				// 		if (cells[12 + j].getSelected()) {
				// 			status = j + 1;
				// 			break;
				// 		}
				// 	} else {
				// 		if (cells[11 + j].getSelected()) {
				// 			status = j + 1;
				// 			break;
				// 		}
				// 	}
				// }

				var comments = "";
				// if (cells[6].getText().indexOf("PokayokesID") === -1) {
				// 	comments += baseComments;
				// }
				// Changes for the JII 5507 for comments
				/*if (self._appType === "C") {
					comments += cells[6].getText();
				} else {
					comments += cells[7].getText();
				}
				if (baseComments) {
					if (comments === "") {
						comments += "\n";
					}
					comments += baseComments;
				}*/
				if (itemData.newComments) {
					comments = itemData.newComments;
				} else {
					comments = "";
				}
				items.push({
					Vornr: itemData.Vornr,
					Uvorn: itemData.Uvorn,
					Parconf: cells[1].getSelected(),
					Finconf: cells[2].getSelected(),
					Pernr: cells[4].getText(),
					Comments: comments,
					Description: cells[5].getText()
						// Status: status.toString()
				});
			});
			oHeader.TOITEMS = items;
			//Call create_deep_entity of OData service
			var model = this._oView.getModel();
			this._oView.setBusy(true);
			model.create("/ORDERLISTSet", oHeader, {
				success: function(oData, response) {
					self._oView.setBusy(false);
					if (oData.Error === "X") {
						sap.m.MessageBox.show(oData.Message, {
							icon: sap.m.MessageBox.Icon.ERROR,
							title: self._oResourceBundle.getText("titleOrderNumber") + " " + oData.Aufnr,
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function() {}
						});
					} else {
						var oSortedData = self._oComponent.getModel().getProperty(self._sItemPath);
						oSortedData.Takeover = "X";
						oSortedData.TakPernr = oData.TakPernr;
						oSortedData.TakDate = oData.TakDate;
						oSortedData.TakTime = oData.TakTime;

						self._oComponent.getModel().setProperty(self._sItemPath, oSortedData);

						// self.byId("btn_priseEnCharge").setIcon("sap-icon://accept");
						// self.byId("btn_priseEnCharge").setType("Accept");

						sap.m.MessageBox.show(self._oResourceBundle.getText("msgOrdreConfirmed"), {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: self._oResourceBundle.getText("titleOrderNumber") + " " + oData.Aufnr,
							actions: [sap.m.MessageBox.Action.OK],
							onClose: function(oAction) {
								self.onQuitter("confirmed");
							}
						});
					}
				},
				error: function(oError) {
					self._oView.setBusy(false);
					sap.m.MessageBox.error(self._oResourceBundle.getText("msgEchecConfirmation") + oError);
				}
			});
			if (this.getView().getModel().hasPendingChanges()) {
				this.getView().getModel().submitChanges({
					groupId: "editIATF",
					success: function() {
						self._oView.setBusy(false);
					},
					error: function(oError) {
						self._oView.setBusy(false);
						sap.m.MessageBox.error(self._oResourceBundle.getText("msgEchecConfirmation") + oError);
					}
				});
				this.getView().getModel().submitChanges({
					groupId: "editMaintCounter",
					success: function() {
						self._oView.setBusy(false);
					},
					error: function(oError) {
						self._oView.setBusy(false);
						sap.m.MessageBox.error(self._oResourceBundle.getText("msgEchecConfirmation") + oError);
					}
				});
				self._oView.setBusy(false);
			}
		},

		navToCreateOrderApp: function() {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: "ZPMSEMORDERCREATE",
					action: "DISPLAY_V3"
				}
			})) || "";
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: hash
				}
			});
		},

		navToHome: function() {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation"); // get a handle on the global XAppNav service
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: "#"
				}
			})) || ""; // generate the Hash to display a order
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: hash
				}
			});
		},

		formatDate: function(sDate) {
			var sNewDate = new Date(sDate);
			sNewDate.setMinutes(sNewDate.getMinutes() + sNewDate.getTimezoneOffset());
			return sNewDate;
		},

		formatItem: function(item, subitem) {
			var text = (item / 1);
			if (subitem) {
				text += " " + subitem;
			}
			// return (item / 1);
			return text;
		},

		formatIntervenantName: function(pernr) {
			var data = this.getView().getModel().getProperty("/OWNERSet('" + pernr + "')");
			if (data) {
				return data.Ename;
			} else {
				return "";
			}
		},

		onItemsLoaded: function() {
			var self = this;
			var parentObject, parentObjectData, itemData;
			var oTable = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems");
			if (!oTable) { return; }
			var tableItems = oTable.getItems();
			tableItems.forEach(function(item) {
				/*	if (item.getType() === "Inactive") {
						item.addStyleClass("tableInactiveItems");
					} else {
						item.removeStyleClass("tableInactiveItems");
					} */

				itemData = self.getView().getModel("orderitem").getObject(item.getBindingContextPath());
				//	item.getCells()[2].setSelected(itemData.Finconf);
				/*	if(itemData.Finconf) {
						item.getCells()[2].addStyleClass("sapMRbSel");
					} else{
						item.getCells()[2].removeStyleClass("sapMRbSel");
					} */

				if (itemData.Uvorn && !itemData.Finconf) {
					parentObject = "/ORDERITEMSSet(Aufnr='" + itemData.Aufnr + "',Uvorn='',Vornr='" + itemData.Vornr + "')";
					parentObjectData = self.getView().getModel("orderitem").getObject(parentObject);
					//item.getCells()[2].setSelected(parentObjectData.Finconf);
					//item.getCells()[2].setSelected(parentObjectData.Finconf);
					item.getCells()[1].setEnabled(parentObjectData.Finconf === true ? false : true);
					item.getCells()[2].setEnabled(parentObjectData.Finconf === true ? false : true);
					if (parentObjectData.Finconf) {
						//	item.setType("Inactive");
						item.setType("Navigation");
						item.addStyleClass("tableInactiveItems");
						//item.getCells()[2].addStyleClass("sapMRbSel");
					} else {
						item.setType("Navigation");
						item.removeStyleClass("tableInactiveItems");
						//item.getCells()[2].removeStyleClass("sapMRbSel");
					}
				} else {
					//item.getCells()[2].setSelected(itemData.Finconf);
					//item.getCells()[1].setSelected(itemData.Finconf);
					item.getCells()[1].setEnabled(itemData.Finconf === true ? false : true);
					item.getCells()[2].setEnabled(itemData.Finconf === true ? false : true);

					if (itemData.Finconf) {
						//item.setType("Inactive");
						item.setType("Navigation");
						item.addStyleClass("tableInactiveItems");
						//item.getCells()[2].addStyleClass("sapMRbSel");
					} else {
						item.setType("Navigation");
						item.removeStyleClass("tableInactiveItems");
						//item.getCells()[2].removeStyleClass("sapMRbSel");
					}
				}

			});

		},

		onFuncEquiVHOpen: function() {
			if (!this._hierarchyDialog) {
				this._hierarchyDialog = sap.ui.xmlfragment(this._frgIdHierarchyDialog,
					"PO_MAINTENANCE.view.fragment.hierarchyDialog", this);
				this._oView.addDependent(this._hierarchyDialog);
			}
			this._hierarchyDialog.open();
		},

		onSelect: function(oEvent) {
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").removeSelections(true);
			//	var selectedItem = sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getSelectedItem();
			var selectedItem = oEvent.getSource().getBindingContext().getObject();
			var filters = [];
			//var selectedItem = sap.ui.core.Fragment.byId(this._frgIdHierarchyDialog, "list").getSelectedItem();
			if (selectedItem.ObjType === 'F') {
				this.funclocation = selectedItem;
			} else {
				this.equipment = selectedItem;
			}
			//	var nameSelected = selectedItem.getBindingContext().toString();		- Del by TMA_HAPOT
			var nameSelected = oEvent.getSource().getBindingContext().getObject().Name; //- Ins by TMA_HAPOT
			//	nameSelected = nameSelected.split("'")[1];							- Del by TMA_HAPOT		
			if (nameSelected && nameSelected.length > 0) {
				var filterName = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, nameSelected);
				filters.push(filterName);
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter(filters);
				var objTypeSelected = selectedItem.ObjType;
				// this._tmpObjTypeSelected = "F";
				this._tmpObjTypeSelected = objTypeSelected;
				var filterObjType = new sap.ui.model.Filter("ObjType", sap.ui.model.FilterOperator.EQ, objTypeSelected);
				filters.push(filterObjType);
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter(filters);
			}
		},

		//Navigation path selected event
		onSelectNav: function() {
			sap.ui.core.Fragment.byId(this._frgIdHierarchyDialog, "list").removeSelections(true);
			var selectedItem = sap.ui.core.Fragment.byId(this._frgIdHierarchyDialog, "listNav").getSelectedItem();
			// window._logo = selectedItem.data("base64");
			var filters = [];
			var nameSelected = selectedItem.data("name");
			if (nameSelected && nameSelected.length > 0) {
				var filterName = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, nameSelected);
				filters.push(filterName);
				sap.ui.core.Fragment.byId(this._frgIdHierarchyDialog, "list").getBinding("items").filter(filters);
				var objTypeSelected = this._tmpObjTypeSelected;
				var filterObjType = new sap.ui.model.Filter("ObjType", sap.ui.model.FilterOperator.Contains, objTypeSelected);
				filters.push(filterObjType);
				sap.ui.core.Fragment.byId(this._frgIdHierarchyDialog, "listNav").getBinding("items").filter(filters);
			}

			// var value = selectedItem.getTitle();
			var key = selectedItem.data("name");

			var oData = this.getOwnerComponent().getModel().getProperty("/FUNCLEVELSet('" + key + "')");
			if (oData) {
				this.getOwnerComponent().getModel("selectedTplnr").setProperty("/key", key);
				this.getOwnerComponent().getModel("selectedTplnr").setProperty("/value", oData.Description);
			}
			// var orderAllowed = this.getView().getModel().getProperty("/FUNCLEVELSet('" + nameSelected + "')/OrderAllowed");
			// if (orderAllowed === "X") {
			// 	this._oEventBus.publish("Master", "ShowCanvas");
			// } else {
			// 	this._oEventBus.publish("Master", "ShowLogo");
			// }
			// window._postDescription = selectedItem.getTitle();
			// window._equipeDescription = "";
		},

		handleHierarchyDialogClose: function() {
			this._hierarchyDialog.close();
		},

		// JII 3786	TMA_NAVAY
		onDateChange: function() {
			var currentdate = new Date();
			var datevaluems = Date.parse(currentdate);
			var dateSel = this.getView().byId("breakdownstartdateid").getDateValue();
			var seldatevaluems = Date.parse(dateSel);
			if (seldatevaluems > datevaluems) {
				sap.m.MessageBox.warning("Malfunction date entered is in the future");
			} else {
				return false;
			}
		},

		onActivityDateChange: function(oEvent) {
			var currentdate = new Date();
			var datevaluems = Date.parse(currentdate);
			var creationDateSel = this.getView().byId("breakdownstartdateid").getDateValue();
			var creationDatevaluems = Date.parse(creationDateSel);
			// this.getView().byId("activitydateid").setMaxDate(currentdate);
			// this.getView().byId("activitydateid").setMinDate(creationDateSel);
			var dateSel = this.getView().byId("activitydateid").getDateValue();
			var seldatevaluems = Date.parse(dateSel);
			if (seldatevaluems < creationDatevaluems) {
				sap.m.MessageBox.warning("Activity Date Can't be prior to creation date");
				this.countAD = 0;
				this.countADFuture = 0;
				this.countADPast++;

			} else if (seldatevaluems > datevaluems) {
				sap.m.MessageBox.warning("Date entered is in the future");
				this.countAD = 0;
				this.countADPast = 0;
				this.countADFuture++;
			} else {
				this.countAD++;
				this.countADFuture = 0;
				this.countADPast = 0;
				return false;
			}

		},

		oDateConvert: function(datevalue) {
			var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "yyyy-MM-dd"
			});

			var oDate = dateFormat.format(new Date(datevalue));
			oDate = oDate + "T00:00:00";
			return oDate;
		},

		checkTime: function(i) {
			return (i < 10) ? "0" + i : i;
		},

		// Functional Location Value Help and Equipment value Help events - JII 3786 TMA_NAVAY
		// Handler quand on clique sur le filtre Poste Technique
		onPosteTechniqueValueHelpRequest: function(oEvent) {
			if (!this._oPosteTechniqueDialog) {
				this._oPosteTechniqueDialog = sap.ui.xmlfragment(this._frgIdPosteTechnique,
					"PO_MAINTENANCE.view.fragment.FunctionalLocationHelp", this);
				// this._oPosteTechniqueDialog = sap.ui.xmlfragment(this._frgIdStorageLocationDialog,
				// 	"PO_MAINTENANCE.view.fragment.storageLocation", this);
				this._oView.addDependent(this._oPosteTechniqueDialog);
				this._oPosteTechniqueDialog.setModel(this.getView().getModel());
				this._oPosteTechniqueDialog.setModel(this.getView().getModel("i18n"), "i18n");
			}

			this._oPosteTechniqueDialog.getBinding("items");

			// this._oPosteTechniqueDialog.getModel().refresh(true);
			this.onRefreshList();

			// Filter list based on the selected function location Added by TAMA_NAVAY -- Start
			if (oEvent.getSource().getValue().length > 0) {
				var filters = [];
				var fName = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, oEvent.getSource().getValue().split(" - ")[0]);
				filters.push(fName);
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter(filters);

				var filterObjType = new sap.ui.model.Filter("ObjType", sap.ui.model.FilterOperator.EQ, this.ObjType);
				filters.push(filterObjType);
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter(filters);
			}
			// -- end TMA_NAVAY

			this._oPosteTechniqueDialog.open();

		},
		handleFunctionalDialogSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value");
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("Tplnr", "EQ", sValue));
			aFilters.push(new sap.ui.model.Filter("Pltxt", "EQ", sValue));
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter(aFilters);

		},
		handleFunctionalDialogClose: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts.length) {
				var choosed = aContexts.map(function(oContext) {
					return oContext.getObject();
				});
				this.functionalLocation.setValue(choosed[0].Tplnr);
				this._filterPosteName = choosed[0].Tplnr;
			}
			oEvent.getSource().getBinding("items").filter([]);
		},
		// Handler quand on clique sur le filtre Equipement
		onEquipementValueHelpRequest: function() {
			if (!this._oEquipementDialog) {
				this._oEquipementDialog = sap.ui.xmlfragment(this._frgIdEquipement,
					"PO_MAINTENANCE.view.fragment.EquipmentHelp", this);
				this._oEquipementDialog.attachSearch(this.handleEquipementDialogSearch, this);
				this._oEquipementDialog.setModel(this.getView().getModel());
				this._oEquipementDialog.setModel(this.getView().getModel("i18n"), "i18n");
			}
			var aFilters = [];

			aFilters.push(new sap.ui.model.Filter("Tplnr", sap.ui.model.FilterOperator.EQ, this.functionalLocation.getValue()));

			this.getView().getModel().read("/EQUIPMENT_F4Set", {
				filters: aFilters,
				success: function(oData) {
					console.log(oData);
					var oModelart = new sap.ui.model.json.JSONModel();
					oModelart.setData(oData.results);
					this._oEquipementDialog.setModel(oModelart, "equipmentmodel");
					this._oEquipementDialog.open();
				}.bind(this)
			});

		},

		handleEquipmentHelpDialogSearch: function(oEvent) {

			var sValue = oEvent.getParameter("value");
			var aFilter = new sap.ui.model.Filter("Eqktu", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([aFilter]);

		},

		handleEquipmentHelpDialogClose: function(oEvent) {
			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts.length) {
				var choosed = aContexts.map(function(oContext) {
					return oContext.getObject();
				});
				this.equipmentField.setValue(choosed[0].Equnr);
				this._filterEquipementName = choosed[0].Equnr;
				if (choosed[0].Tplnr != "") {
					this.functionalLocation.setValue(choosed[0].Tplnr);
				} else {
					return false;
				}

			}
			oEvent.getSource().getBinding("items").filter([]);
		},

		onSelectFuncLoc: function(oEvent) {
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").removeSelections(true);
			//	var selectedItem = sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getSelectedItem();
			var selectedItem = oEvent.getSource().getBindingContext().getObject();
			var filters = [];
			//var selectedItem = sap.ui.core.Fragment.byId(this._frgIdHierarchyDialog, "list").getSelectedItem();
			if (selectedItem.ObjType === 'F') {
				this.funclocation = selectedItem;
			} else {
				this.equipment = selectedItem;
			}
			//	var nameSelected = selectedItem.getBindingContext().toString();		- Del by TMA_HAPOT
			var nameSelected = oEvent.getSource().getBindingContext().getObject().Name; //- Ins by TMA_HAPOT
			//	nameSelected = nameSelected.split("'")[1];							- Del by TMA_HAPOT		
			if (nameSelected && nameSelected.length > 0) {
				var filterName = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, nameSelected);
				filters.push(filterName);
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter(filters);
				var objTypeSelected = selectedItem.ObjType;
				// this._tmpObjTypeSelected = "F";
				this._tmpObjTypeSelected = objTypeSelected;
				var filterObjType = new sap.ui.model.Filter("ObjType", sap.ui.model.FilterOperator.EQ, objTypeSelected);
				filters.push(filterObjType);
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter(filters);
			}
		},

		onSelectNavFuncHelp: function() {
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").removeSelections(true);
			var selectedItem = sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getSelectedItem();
			window._logo = selectedItem.data("base64");
			var filters = [];
			var nameSelected = selectedItem.data("name");
			if (nameSelected && nameSelected.length > 0) {
				var filterName = new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, nameSelected);
				filters.push(filterName);
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter(filters);
				var objTypeSelected = this._tmpObjTypeSelected;

				// Begin of changes by TMA_HAPOT on 29/11/2021
				if (objTypeSelected === 'F' && nameSelected != '') {
					//	this._funcLocation = this.oSelected;
					//	this.functionalLocation.setValue(this._funcLocation);	
				} else {
					//		this._funcLocation = this.oSelected;
					//		this.functionalLocation.setValue(this._funcLocation);  
					this.equipmentField.setValue(nameSelected);
				}
				// End of changes by TMA_HAPOT on 29/11/2021
			}
			var filterObjType = new sap.ui.model.Filter("ObjType", sap.ui.model.FilterOperator.Contains, objTypeSelected);
			filters.push(filterObjType);
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter(filters);
			// }	

		},

		onSelectItem: function(oEvent) {
			this.oSelected = oEvent.getSource().getBindingContext().sPath.split("'")[1];
			if (oEvent.getSource().getParent().getBindingContext().getObject().ObjType === 'F') {
				this._funcLocation = oEvent.getSource().getParent().getBindingContext().getObject().Name;
			}
		},
		onConfirmHierarchy: function() {
			/*	this.functionalLocation.setValue(this.oSelected);
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter();
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").setSelectedItem();
				sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter();
				this._oPosteTechniqueDialog.close();*/

			var list = sap.ui.getCore().byId(this._frgIdPosteTechnique + "--list");
			var oItem = list.getSelectedItem();

			var funclochange = false;
			var objType = oItem.getBindingContext().getObject().ObjType;
			if (objType === 'F') {
				var funcloc = oItem.getBindingContext().getObject().Name;
				var funlocDesc = oItem.getBindingContext().getObject().Description;
				if (this.funclocation) {
					if (funcloc !== this.funclocation.Name) {
						this.funclocation.Name = funcloc;
						this.funclocation.Description = funlocDesc;
						this.equipmentField.setValue("");
						funclochange = true;
					} else if (funcloc === this.funclocation.Name && this.parent === true) {
						this.equipmentField.setValue("");
						funclochange = true;
						this.parent = false;
					}
				} else {
					this.functionalLocation.setValue(funcloc);
				}
			} else {
				var equipment = oItem.getBindingContext().getObject().Name;
				if (this.equipment) {
					if (equipment !== this.equipment.Name) {
						this.equipment.Name = equipment;
					}
				} else {
					this.equipment = {};
					this.equipment.Name = equipment;
				}
			}
			if (this.funclocation) {
				this.functionalLocation.setValue(this.funclocation.Name + " - " + this.funclocation.Description);
			}
			if (this.equipment !== undefined && funclochange === false) {
				this.equipmentField.setValue(this.equipment.Name);
			}
			this._oPosteTechniqueDialog.close();

		},

		handleFuncHelpDialogClose: function() {
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter();
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").setSelectedItem();
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter();
			this._oPosteTechniqueDialog.close();
		},
		//Refresh list button clicked
		onRefreshList: function() {

			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter();
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").setSelectedItem();
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter();

		},
		//List search event
		onSearch: function() {
			this.oInitialLoadFinishedDeferred = jQuery.Deferred();
			// Add search filter
			var filters = [];
			var searchString = sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "searchField").getValue();
			if (searchString && searchString.length > 0) {
				filters = [new sap.ui.model.Filter("Description", sap.ui.model.FilterOperator.Contains, searchString)];
			}
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter();
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").setSelectedItem();
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "listNav").getBinding("items").filter();
			sap.ui.core.Fragment.byId(this._frgIdPosteTechnique, "list").getBinding("items").filter(filters);

			//On phone devices, there is nothing to select from the list
			if (sap.ui.Device.system.phone) {
				return;
			}
		},

		// Formatter for Counter data MAINT and IATF 
		/*count: 0,
		maintActualValue: function(sdata) {
			var that = this;

			var MaintCounterTable = sap.ui.core.Fragment.byId(this._frgIdMaintenanceCounter, "filterMaintCounter");
			var MaintCounterModel = MaintCounterTable.getModel();
			var MaintCounterItems = MaintCounterTable.getItems();
			var data;
			for (var i = 0; i < MaintCounterItems.length; i++) {
				var num = that.count;
				data = MaintCounterModel.getProperty(MaintCounterItems[num].getBindingContextPath());

				if (data.Recdu == "HR") {
					var hourData = sdata / 3600;
					that.count++;
					return hourData;
				} else if (data.Recdu == "MIN") {
					var hourData = sdata / 60;
					that.count++;
					return Math.trunc(hourData);
				} else if (data.Recdu != "HR" && data.Recdu != "MIN") {
					that.count++;
					return sdata;
				}

			}

		}, */

		// Formatter for Counter data MAINT
		maintActualValue: function(actualTime, recdu) {
			var hourData;
			if (recdu === "HR" || recdu === "H" || recdu === "HRS") {
				hourData = actualTime / 3600;
				return hourData;
			} else if (recdu === "MIN") {
				hourData = actualTime / 60;
				return Math.trunc(hourData);
			} else {
				return Math.trunc(actualTime);
			}
		},

		onRbResetter: function() {
			//this._frgItems = sap.ui.xmlfragment(this._frgIdItems, "PO_MAINTENANCE.view.fragment.items", this);
			// this._frgItems.get   
			//var RB1 = sap.ui.core.Fragment.byId(this._frgItems, "cbPartielle");
			//	var RB1 = this.byId(sap.ui.core.Fragment.createId("this._frgIdItems", "cbPartielle"));
			// var RB2 = this.getView().byId("cbDefinitive");

			// var RB2 = sap.ui.core.Fragment.byId(this._frgItems, "cbDefinitive");
			//RB1.setSelectedIndex(null);
			// RB2.setSelectedIndex(null);

			var tableItems = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
			tableItems.forEach(function(item) {
				//	item.setType("Navigation");
				item.getCells()[1].setSelected(false);
				item.getCells()[2].setSelected(false);
				//	item.getCells()[1].setEnabled(true);
				//	item.getCells()[2].setEnabled(true);
			});

			/*	var parConf =	itemsTab.byId("itemsTemplate");
				var finConf =	itemsTab.byId("cbDefinitive");
				parConf.setSelectedIndex(null);
				finConf.setSelectedIndex(null); */

		},

		/** 
		 * Function to mark order list items rows as navigation or inactive
		 * @param item
		 * @param subItem
		 * @param order
		 * @param finConf
		 * @returns
		 */
		formatItemType: function(item, subItem, order, finConf) {
			var parentObject, parentObjectData, isFinalConf;
			if (item && subItem !== "" && !finConf) {
				parentObject = "/ORDERITEMSSet(Uvorn='',Aufnr='" + order + "',Vornr='" + item + "')";
				parentObjectData = this.getView().getModel("orderitem").getObject(parentObject);
				isFinalConf = parentObjectData.Finconf;
			} else {
				isFinalConf = finConf;
			}

			if (isFinalConf) {
				return "Inactive";
			} else {
				return "Navigation";
			}
		},
		/** 
		 * Logic to enable/disbale order list item radio buttons
		 * @param item
		 * @param subItem
		 * @param order
		 * @param finConf
		 * @returns
		 */
		enableConfirmationBtn: function(item, subItem, order, finConf) {
			var parentObject, parentObjectData;
			if (item && subItem !== "" && !finConf) {
				parentObject = "/ORDERITEMSSet(Uvorn='',Aufnr='" + order + "',Vornr='" + item + "')";
				parentObjectData = this.getView().getModel("orderitem").getObject(parentObject);
				return parentObjectData.Finconf === true ? false : true;
			} else {
				return finConf === true ? false : true;
			}
		},

		/** 
		 * logic for the radio button selection
		 * @param item
		 * @param subItem
		 * @param order
		 * @param finConf
		 * @returns
		 */
		selectConfirmationBtn: function(item, subItem, order, finConf) {
			var parentObject, parentObjectData;
			if (item && subItem !== "" && !finConf) {
				parentObject = "/ORDERITEMSSet(Uvorn='',Aufnr='" + order + "',Vornr='" + item + "')";
				parentObjectData = this.getView().getModel("orderitem").getObject(parentObject);
				return parentObjectData.Finconf;
			} else {
				return finConf;
			}
		},

		convertDate: function(date, time) {
			var recordedDate, recordedTime;
			if (date !== null) {
				var dateFormat = sap.ui.core.format.DateFormat.getDateInstance({});
				recordedDate = dateFormat.format(date);
			}
			if (time !== undefined && time !== null) {

				var seconds = time.ms / 1000;
				var hours = parseInt(seconds / 3600);
				seconds = seconds % 3600;
				var minutes = parseInt(seconds / 60);
				seconds = seconds % 60;

				hours = ("00" + hours).slice(-2);
				minutes = ("00" + minutes).slice(-2);
				seconds = ("00" + seconds).slice(-2);
				recordedTime = hours + ":" + minutes + ":" + seconds;

			}

			return recordedDate + " " + recordedTime;
		},

		finalhours: function(flag, hours) {
			if (flag === 'X') {
				return this._oResourceBundle.getText("Final") + " " + hours + " (MIN)";
			} else {
				return this._oResourceBundle.getText("Partial") + " " + hours + " (MIN)";
			}
		},
		onCommentsUpdateFinished: function(oEvent) {
			oEvent.getSource().setBusy(false);
		},

		// Format the item comments, in case comments is empty then show standard text
		onFormatItemComments: function(comments, time) {
			if (time !== '0.0') {
				return this._oResourceBundle.getText("emptyComments");
			} else {
				return "";
			}
		},

		// onUploadAttachment: function() {
		// 	this._frgAttachUploader.open();
		// },

		// applicable to JII-5748 - code removed 
		// onFileChange: function(oEvent) {
		// 	// Header Token
		// 	 this.getView().getModel().refreshSecurityToken();
		// 	 var oCustomerHeaderToken = new sap.ui.unified.FileUploaderParameter({
		// 		name: "x-csrf-token",
		// 		value: this.getView().getModel().getHeaders()['x-csrf-token'] //this._token //"securityTokenFromModel"
		// 	});
		// 	var oCustomerHeaderSlug = new sap.ui.unified.FileUploaderParameter({
		// 		name: "slug",
		// 		value: oEvent.getParameters().files[0].name
		// 	});
		// 	oEvent.getSource().insertHeaderParameter(oCustomerHeaderToken);
		// 	oEvent.getSource().insertHeaderParameter(oCustomerHeaderSlug);
		// 	oEvent.getSource().upload();

		// 	this._frgAttachUploader.close();
		// },
		handleAttachUploadComplete: function() {
			this.getView().getModel().refresh(true);
		},

		// JII 5748
		// onUploaderClose: function() {
		// 	this._frgAttachUploader.close();
		// },

		onAttachmentPress: function(oEvent) {
			var data = oEvent.getSource().getBindingContext().getObject();
			var color = this.funcLocObj.Color;
			var object;
			if (color === "CDCDCDC") {
				object = "EQUI";
			} else {
				object = "IFLOT";
			}
			//ObjType
			var url = "/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/attach_dSet(Dokar='" + data.DocType + "',Doktl='" + data.DocPart + "',Doknr='" +
				data.DocID + "',Dokvr='" + data.DocVersion + "',Dokob='" + object + "',Objky='" + this.funcLocObj.Name + "')/$value";
			//var url="/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/doclistSet(DocType='" + data.DocType + "',DocPart='" + data.DocPart + "' DocID='" + data.DocID +  "',DocVersion='" + data.DocVersion + "',Equipment='" + data.Equipment + "' FuncLoc='" + data.FuncLoc +"')/$value";
			sap.m.URLHelper.redirect(url, true);
		},

		onConfirmationSelection: function(oEvent) {
			/*	var isParentItem = oEvent.getSource().getParent().getModel("orderitem").getProperty(oEvent.getSource().getParent().getBindingContextPath()).Uvorn === ""?true:false;
				var ParentItemNumber = oEvent.getSource().getParent().getModel("orderitem").getProperty(oEvent.getSource().getParent().getBindingContextPath()).Vornr;
				var tableItems = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
				if(oEvent.getParameter("id").includes("cbDefinitive")) {
					oEvent.getSource().getParent().setType("Inactive"); // Disable the selected line item in the table
					oEvent.getSource().getParent().getCells()[1].setEnabled(false); // Disable Partial Confirmation radio button
					oEvent.getSource().getParent().getCells()[2].setEnabled(false); //Disable Final Confirmation Radio button
				}
				if(isParentItem) {
					tableItems.forEach(function(item) {
						if(item.getModel("orderitem").getProperty(item.getBindingContextPath()).Vornr === ParentItemNumber) {
							item.setType("Inactive");
							item.getCells()[1].setEnabled(false);
							item.getCells()[2].setEnabled(false);
						}
					});
				}*/
		},

		//JII 3786 end TMA_NAVAY
		// onFinalConfChange: function() {
		// 	//this.finalConfUserChange = true;
		// 	this._oView.getModel().setProperty(self._sItemPath + "/Finconf", false);
		// }

		//Add or modify item
		onAddEditItem: function() {
			var techSelected = this._oView.byId("cb_intervenant").getSelectedKey();
			if (!this._addEditItemDialog) {
				this._addEditItemDialog = sap.ui.xmlfragment(this._frgIdaddEditItemDialog, "PO_MAINTENANCE.view.fragment.addEditItem", this);
				this._oView.addDependent(this._addEditItemDialog);
			}
			var funcLoc = this.getView().getModel().getProperty(this._sItemPath).Tplnr;
			var aFilters = [];
			aFilters.push(new sap.ui.model.Filter("Tplnr", sap.ui.model.FilterOperator.EQ, funcLoc));
			sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_workcenter").getBinding("items").filter(aFilters);
			sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_workcenter").setSelectedKey(this.byId("DetailsPage").getBindingContext()
				.getObject()
				.Gewrk);
			// if (techSelected === '00000000' || techSelected === '') {
			// 	sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").setSelectedKey("");
			// } else {
			// 	sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").setSelectedKey(techSelected);
			// }
			this._addEditItemDialog.open();
		},
		closeNewDialog: function() {
			sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").setValueState("None");
			sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").setValue("");
			//sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").clearSelection();
			//sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").setValue("");
			sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_workcenter").clearSelection();
			sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_workcenter").setValue("");

			if (this._addEditItemDialog) {
				this._addEditItemDialog.close();
			}
		},

		saveNewItem: function() {
			sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").setValueState("None");
			//	var dialogIntervenant = sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").getSelectedKey();
			var dialogWorkcenter = sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_workcenter").getSelectedKey();
			// var dialogIntervenantName = sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").getSelectedItem().getText();
			//	var dialogIntervenantName = (dialogIntervenant) ? sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "cb_intervenant").getSelectedItem()
			//		.getText() : "";

			var dialogDescription = sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").getValue();
			if (dialogDescription === "") {
				// & this._tmpItemNo !== "0010") {
				sap.ui.core.Fragment.byId(this._frgIdaddEditItemDialog, "itemDesc").setValueState("Error");
				return;
			}
			var newItem = {};
			newItem.Aufnr = this.aufnr;
			newItem.Gewrk = dialogWorkcenter;
			// newItem.Pernr = dialogIntervenant;
			// newItem.Ename = dialogIntervenantName;
			newItem.Description = dialogDescription;
			newItem.Vornr = ((sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems().length + 1) * 10).toString();
			newItem.Uvorn = "";
			//	var tmpItemNo = "00" + (parseInt(lastItem.Vornr) + 10);
			//	newItem.Vornr = tmpItemNo.substring(tmpItemNo.length - 4);
			//	this._itemsData.push(newItem);

			this.getView().getModel().create("/ORDERITEMSSet", newItem, {
				success: function(oData) {
					this.getView().getModel("orderitem").refresh();
				}.bind(this)
			});

			this.closeNewDialog();
			//	this.refreshTableItems();
		},

		onActivityDelete: function(oEvent) {
			var itemsLength = oEvent.getSource().getParent().getParent().getItems().length;
			var self = this;
			if (itemsLength === 1) {
				sap.m.MessageBox.error(this._oResourceBundle.getText("activityDeletionValidationErr"));
			} else {
				var selectedpath = oEvent.getSource().getParent().getBindingContextPath();
				this.getView().getModel("orderitem").remove(selectedpath, {
					success: function(data) {
						sap.m.MessageToast.show(this._oResourceBundle.getText("activitySuccessDelete"));
						var tableItems = sap.ui.core.Fragment.byId(this._frgIdItems, "tableItems").getItems();
						var itemData, isAllRecordsFinConfirmed, orderNumber;
						orderNumber = tableItems[0].getBindingContext().getObject().Aufnr;
						isAllRecordsFinConfirmed = tableItems.every(function(item) {
							itemData = self.getView().getModel("orderitem").getObject(item.getBindingContextPath());
							if (itemData) {
								return itemData.Finconf;
							} else {
								return true;
							}
						});

						if (isAllRecordsFinConfirmed) {
							sap.m.MessageBox.show(self._oResourceBundle.getText("lastActivityOperationDelted"), {
								icon: sap.m.MessageBox.Icon.SUCCESS,
								title: self._oResourceBundle.getText("titleOrderNumber") + " " + orderNumber,
								actions: [sap.m.MessageBox.Action.OK],
								onClose: function(oAction) {
									self.onQuitter("confirmed");
								}
							});
							//	self.onQuitter("confirmed");
						}
					}.bind(this),
					error: function(oError) {
						sap.m.MessageBox.error(JSON.parse(oError.responseText).error.message.value);
					}
				});
			}
		},

		onAssignToPress: function() {
			var oView = this.getView();
			var oComboBox = oView.byId("cb_intervenant");
			var oItem = oComboBox.getSelectedItem();

			if (!oItem) {
				MessageBox.error(this._oResourceBundle.getText("techNotSelected"));
				return;
			}

			oView.getModel().callFunction("/AssignToRes", {
				method: "POST",
				urlParameters: {
					Aufnr: "'" + this.aufnr + "'",
					Pernr: "'" + oItem.getKey() + "'"
				},
				success: function(oData) {
					this.getView().getModel().refresh(true);
					MessageToast.show(this._oResourceBundle.getText("responsibleSuccess"));
				}.bind(this),
				error: function(oError) {
					MessageBox.error(JSON.parse(oError.responseText).error.message.value);
				}
			});

		}

	});
});