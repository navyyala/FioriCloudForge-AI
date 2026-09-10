sap.ui.define([
	"sap/ndc/BarcodeScanner",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/m/Dialog",
	"sap/m/Input",
	"sap/m/Text",
	"sap/m/HBox",
	"sap/m/Button",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BarcodeScanner, MessageToast, MessageBox, Dialog, Input, Text, HBox, Button, Filter, FilterOperator) {
	/**
	 * @namespace PO_MAINTENANCE.util
	 * @class PO_MAINTENANCE.util.stockOutputHelper
	 * Mixin providing barcode-scan article lookup and stock output (goods issue) deletion
	 * for the Details controller. Mixed in via `stockOutputHelper: stockOutputHelper`.
	 */
	return {
		/**
		 * Launches the native barcode scanner and fills the article input in the add-article dialog.
		 * Bound to the Details controller context via the mixin pattern.
		 */
		onScanArticleCode: function() {
			BarcodeScanner.scan(
				function(oResult) {
					if (oResult && !oResult.cancelled) {
						sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").setValue(oResult.text); // put scanned text into input
						MessageToast.show("{i18n>scanned}: " + oResult.text);
					} else {
						MessageToast.show("{i18n>scancancelled}");
					}
				}.bind(this),
				function(sError) {
					MessageBox.error(sError || "{i18n>scanfailed}");
				}
			);

		},

		/**
		 * Confirms and deletes a goods-issue stock output entry.
		 * Opens a quantity confirmation dialog before removing the GOODS_ISSUESet entry.
		 * @param {sap.ui.base.Event} oEvent - press event from the delete button in the stock output table
		 */
		onDeleteStockOutput: function(oEvent) {
			var selectedPath = oEvent.getSource().getParent().getBindingContextPath();
			this.selectedData = this.getView().getModel("orderitem").getProperty(selectedPath);
			if (!this._stockOutputDeleteConfDialog) {
				var oInput = new Input({
					type: "Number",
					change: this.stockOutputHelper.quantityCheck.bind(this)
				});
				this._stockOutputDeleteConfDialog = new Dialog({
					title: this._oResourceBundle.getText("textBtnConfirmed"),
					content: [
						new HBox({
							width: "100%",
							items: [
								new Text({
									text: this._oResourceBundle.getText("stockConfirmMsg")
								}).addStyleClass("sapUiTinyMargin"),
								oInput
							]
						}).addStyleClass("sapUiMediumMargin")
					],

					beginButton: new Button({
						text: this._oResourceBundle.getText("textBtnDelete"),
						type: sap.m.ButtonType.Reject,
						press: function(oEvent) {
							var quantity = oEvent.getSource().getParent().getContent()[0].getItems()[1].getValue();
							var entryToBeDeleted = "/GOODS_ISSUESet(Aufnr='" + this.selectedData.Aufnr + "',Matnr='" + this.selectedData.Matnr +
								"',Quantity=" +
								quantity + ",Lgort='" + this.selectedData.Lgort + "',Bwtar='" + this.selectedData.Bwtar + "',Returns='" + this.selectedData
								.Returns + "')";
							this.getView().getModel("orderitem").remove(entryToBeDeleted, {
								success: function() {
									MessageToast.show(this._oResourceBundle.getText("successMessage"));
									this.selectedData = null;
									this._stockOutputDeleteConfDialog.close();
								}.bind(this),
								error: function(oError) {
									MessageBox.error(JSON.parse(oError.responseText).error.message.value);
									this.selectedData = null;
								}
							});

						}.bind(this)
					}),
					endButton: new Button({
						text: this._oResourceBundle.getText("textBtnCancel"),
						type: sap.m.ButtonType.Transparent,
						press: function() {
							this.selectedData = null;
							this._stockOutputDeleteConfDialog.close();
						}.bind(this)

					})
				});
				this._stockOutputDeleteConfDialog.getContent()[0].getItems()[1].setValue(Math.abs(this.selectedData.Quantity));
				this._stockOutputDeleteConfDialog.open();
			} else {
				this._stockOutputDeleteConfDialog.getContent()[0].getItems()[1].setValue(Math.abs(this.selectedData.Quantity));
				this._stockOutputDeleteConfDialog.open();
			}
		},

		onAddStockOutout: function(oEvent, controller) {
			var selectedPath = oEvent.getSource().getParent().getBindingContextPath();
			var selectedData = this.getView().getModel("orderitem").getProperty(selectedPath);

			this.onStock(oEvent, selectedData.Matnr, selectedData.Quantity);
		},

		quantityCheck: function(oEvent) {
			var enteredValue;
			if (oEvent.getSource().getValue()) {
				enteredValue = oEvent.getSource().getValue();
				if (enteredValue > Math.abs(this.selectedData.Quantity) || enteredValue <= 0) {
					oEvent.getSource().setValueState("Error");
					oEvent.getSource().setValueStateText(this._oComponent.getModel("i18n").getResourceBundle().getText("quantityError"));
					this._stockOutputDeleteConfDialog.getBeginButton().setEnabled(false);
				} else {
					oEvent.getSource().setValueState("None");
					oEvent.getSource().setValueStateText("");
					this._stockOutputDeleteConfDialog.getBeginButton().setEnabled(true);
				}
			}
		},

		onConditionVH: function() {
			if (!this._conditionDialog) {
				this._conditionDialog = sap.ui.xmlfragment(this._frgIdConditionDialog,
					"PO_MAINTENANCE.view.fragment.condition", this);
				this._oView.addDependent(this._conditionDialog);
			}
			//JII-6585
			var articleCode = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").getValue();
			var storageLocation = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputStoreLocation").getValue();
			var oBinding = sap.ui.core.Fragment.byId(this._frgIdConditionDialog, "condition").getBinding("items");
			var aFilters = [];
			aFilters.push(new Filter(
				"Bwtar",
				FilterOperator.EQ,
				""
			));
			aFilters.push(new Filter(
				"Werks",
				FilterOperator.EQ,
				""
			));

			if (articleCode !== "") {
				aFilters.push(new Filter(
					"Matnr",
					FilterOperator.EQ,
					articleCode
				));
			}
			if (storageLocation !== "") {
				aFilters.push(new Filter(
					"Lgort",
					FilterOperator.EQ,
					storageLocation
				));
			}
			oBinding.filter(aFilters);
			this._conditionDialog.open();
		},
		handleConditionClose: function(oEvent) {
			var sSelectedKey = oEvent.getParameter("selectedItem").getDescription();

			sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputCondition").setValue(sSelectedKey);

		},

		onStockReturn: function(oEvent) {
			var self = this;
			var oElement = {};
			var oButton = oEvent.getSource();

			sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").setValueState("None");
			var Aufnr = this._sItemPath.split("'")[1];
			var Matnr = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputArticle").getValue();
			var quantity = parseInt(sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").getValue(), 10);
			var Lgort = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputStoreLocation").getValue();
			//oElement.Returns = sReturns;
			var Bwtar = sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputCondition").getValue();

			var entryToBeDeleted = "/goods_returnSet(Aufnr='" + Aufnr + "',Matnr='" + Matnr +
				"',Quantity=" +
				quantity + ",Lgort='" + Lgort + "',Bwtar='" + Bwtar + "')";
			// if (!oElement.Quantity || oElement.Quantity <= 0) {
			// 	sap.ui.core.Fragment.byId(this._frgIdAddArticleDialog, "inputQty").setValueState("Error");
			// 	return;
			// }
			this.getView().getModel("orderitem").remove(entryToBeDeleted, {
				success: function(oData) {

					sap.m.MessageBox.show(
						this._oResourceBundle.getText("stockReturnSuccesss"), {
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
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputCondition").setValue("");
					//	this._oComponent.getModel("stock").setProperty("/date", new Date());
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "inputStoreLocation").setValue();
					sap.ui.core.Fragment.byId(self._frgIdAddArticleDialog, "storageLocationDesc").setText();
					this.getOwnerComponent().getModel("orderitem").refresh(true);
				}.bind(this),
				error: function(oError) {

				}
			});
		},

		formatPositive: function(value) {
			if (value == null) {
				return "";
			}
			return Math.abs(value);
		},
		
		onAddStock: function(oEvent) {
			var stockType = oEvent.getSource().data("stockType");
			this.onStock(oEvent, null, null, stockType);
		},
		
		onLiveChangeQuantity: function(oEvent) {
			var value = oEvent.getParameter("value").replace(/[^0-9]/g, "");
			oEvent.getSource().setValue();
			oEvent.getSource().setValue(value);
		},
		
		removeQuantityDecimals: function (vValue) {
		    if (vValue === null || vValue === undefined || vValue === "") {
		        return "";
		    }
		
		    return parseInt(vValue, 10);
		}

	};
});