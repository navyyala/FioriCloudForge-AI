// define a root UI component that exposes the main view
jQuery.sap.declare("PO_MAINTENANCE.Component");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.ui.core.routing.History");
jQuery.sap.require("sap.m.routing.RouteMatchedHandler");
sap.ui.core.UIComponent.extend("PO_MAINTENANCE.Component", {
	metadata: {
		"name": "PO_MAINTENANCE",
		"version": "1.1.0-SNAPSHOT",
		"library": "PO_MAINTENANCE",
		"includes": ["css/fullScreenStyles.css"],
		"dependencies": {
			"ui5version": "1.28.15",
			"libs": [
				"sap.m",
				"sap.ui.layout"
			],
			"components": []
		},
		"config": {
			"resourceBundle": "i18n/messageBundle.properties",
			"serviceConfig": {
				"name": "ZGPM_CONFIRM_ORDER_SRV",
				"serviceUrl": "/sap/opu/odata/sap/ZGPM_CONFIRM_ORDER_SRV/"
			}
		},
		routing: {
			// The default values for routes
			config: {
				"viewType": "XML",
				"viewPath": "PO_MAINTENANCE.view",
				"targetControl": "fioriContent",
				// This is the control in which new views are placed
				"targetAggregation": "pages",
				// This is the aggregation in which the new views will be placed
				"clearTarget": false
			},
			routes: [{
				pattern: "",
				name: "main",
				view: "Master"
			}, {
				name: "details",
				view: "Details",
				pattern: "{entity}/:from:"
			}]
		}
	},
	/**
	 * Initialize the application
	 *
	 * @returns {sap.ui.core.Control} the content
	 */
	createContent: function () {
		var oViewData = {
			component: this
		};
		return sap.ui.view({
			viewName: "PO_MAINTENANCE.view.Main",
			type: sap.ui.core.mvc.ViewType.XML,
			viewData: oViewData
		});
	},
	init: function () {
		// call super init (will call function "create content")
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);
		// always use absolute paths relative to our own component
		// (relative paths will fail if running in the Fiori Launchpad)
		var sRootPath = jQuery.sap.getModulePath("PO_MAINTENANCE");
		// The service URL for the oData model
		var oServiceConfig = this.getMetadata().getConfig().serviceConfig;
		var sServiceUrl = oServiceConfig.serviceUrl;
		// the metadata is read to get the location of the i18n language files later
		var mConfig = this.getMetadata().getConfig();
		this._routeMatchedHandler = new sap.m.routing.RouteMatchedHandler(this.getRouter(), this._bRouterCloseDialogs);
		// create oData model
		this._initODataModel(sServiceUrl);
		// set i18n model
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: [
				sRootPath,
				mConfig.resourceBundle
			].join("/")
		});
		this._appType = "C";
		this.setModel(i18nModel, "i18n");
		this.setModel(new sap.ui.model.json.JSONModel(), "displaySettings");
		var messageModel = new sap.ui.model.json.JSONModel();
		messageModel.setData([]);
		this.setModel(messageModel, "messageModel");
		this._getDisplaySettings();
		this.setModel(new sap.ui.model.json.JSONModel({
			"admin": false,
			"edit": false
		}), "userMode");
		this.setModel(new sap.ui.model.json.JSONModel({
			"PokayokeIDCode": ""
		}), "PokayokeModel");
		this.setModel(new sap.ui.model.json.JSONModel({
			"technician": "",
			"assigned": false,
			"notAssigned": false
		}), "assignment");
		this.setModel(new sap.ui.model.json.JSONModel({}), "checkBoxModel");
		this.setModel(new sap.ui.model.json.JSONModel({
			"results": []
		}), "serialNumber");
		this.setModel(new sap.ui.model.json.JSONModel({
			"from": ""
		}), "external");
		this.setModel(new sap.ui.model.json.JSONModel({}), "confirmText");
		
		// Set device model
		var oDeviceModel = new sap.ui.model.json.JSONModel({
			isTouch: sap.ui.Device.support.touch,
			isNoTouch: !sap.ui.Device.support.touch,
			isPhone: sap.ui.Device.system.phone,
			isNoPhone: !sap.ui.Device.system.phone,
			listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive",
			system: sap.ui.Device.system
		});
		oDeviceModel.setDefaultBindingMode("OneWay");
		this.setModel(oDeviceModel, "device");
		
		// initialize router and navigate to the first page
		this.getRouter().initialize();
	},
	exit: function () {
		this._routeMatchedHandler.destroy();
	},
	// This method lets the app can decide if a navigation closes all open dialogs
	setRouterSetCloseDialogs: function (bCloseDialogs) {
		this._bRouterCloseDialogs = bCloseDialogs;
		if (this._routeMatchedHandler) {
			this._routeMatchedHandler.setCloseDialogs(bCloseDialogs);
		}
	},
	// creation and setup of the oData model
	_initODataModel: function (sServiceUrl) {
		jQuery.sap.require("PO_MAINTENANCE.util.messages");
		var oConfig = {
			metadataUrlParams: {},
			json: true,
			// loadMetadataAsync : true,
			defaultBindingMode: "TwoWay",
			defaultCountMode: "Inline",
			useBatch: false
		};
		var oModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl, oConfig);
		var oOrderItemModel = new sap.ui.model.odata.v2.ODataModel(sServiceUrl);
		oModel.attachRequestFailed(null, PO_MAINTENANCE.util.messages.showErrorMessage); //eslint-disable-line no-undef
		this.setModel(oModel);
		this.setModel(oOrderItemModel, "orderitem");
	},
	_getDisplaySettings: function () {
		var self = this;
		this.getModel().read("/DISPLAY_SETTINGSSet", {
			success: function (oData) {
				for (var i in oData.results) {
					if (oData.results[i].Field === "manager") {
						self.getModel("userMode").setProperty("/admin", oData.results[i].Enable ? true : false);
					} else {
						self.getModel("displaySettings").setProperty("/" + oData.results[i].Field, oData.results[i]);
					}
					if (oData.results[i].Field === "edit") {
						self.getModel("userMode").setProperty("/edit", oData.results[i].Enable ? true : false);
					}
					
						// self.getModel("userMode").setProperty("/edit", false);
				}
			},
			error: function (oError) {}
		});
	}
});