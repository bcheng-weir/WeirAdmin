angular.module('orderCloud')
    .config(CustomerConfig)
    .factory('CustomerService', CustomerService)
    .controller('CustomerCtrl', CustomerCtrl)
    .controller('CustomerEditCtrl', CustomerEditCtrl)
    .controller('CustomerAddressEditCtrl', CustomerAddressEditCtrl)
    .controller('CustomerCreateCtrl', CustomerCreateCtrl)
    .controller('CustomerAddressCreateCtrl', CustomerAddressCreateCtrl)
    .controller('CustomerAssignCtrl', CustomerAssignCtrl)
    .controller('CustomersSharedCtrl', CustomersSharedCtrl)
;

function CustomerConfig($stateProvider) {
    $stateProvider
        .state('customers', {
            parent: 'base',
            templateUrl: 'customers/templates/customers.tpl.html',
            controller: 'CustomerCtrl',
            controllerAs: 'customers',
            url: '/customers?search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Customers'},
            resolve: {
                Me: function(OrderCloudSDK) {
                    return OrderCloudSDK.Me.Get();
                },
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                BuyerList: function(OrderCloudSDK, Parameters, Me) {
                    var filter = {
                    	"ID":Me.xp.WeirGroup.label+'*'
                    };
                    var opts = {
                        search: Parameters.search,
                        page: Parameters.page,
                        pageSize: Parameters.pageSize || 100,
                        filters: filter
                    };
                    return OrderCloudSDK.Buyers.List(opts);
                }
            }
        })
        .state('customers.edit', {
            url: '/:buyerid/edit',
            templateUrl: 'customers/templates/customerEdit.tpl.html',
            controller: 'CustomerEditCtrl',
            controllerAs: 'customerEdit',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloudSDK){
                    return OrderCloudSDK.Buyers.Get($stateParams.buyerid);
                },
                AddressList: function(OrderCloudSDK, $stateParams, Parameters, SelectedBuyer) {
                    var f = {
                        "xp.active":"true"
                    };
                    var opts = {
                        filters: f
                    };
                    return OrderCloudSDK.Addresses.List(SelectedBuyer.ID, opts);
                },
                WeirGroup: function (OrderCloudSDK, SelectedBuyer) {
                    return OrderCloudSDK.Catalogs.Get(SelectedBuyer.xp.WeirGroup.label);
                },
                RelatedBuyer: function(OrderCloudSDK, SelectedBuyer) {
                    var relatedID = null;

                    if(SelectedBuyer.xp && SelectedBuyer.xp.AKA) {
                        angular.forEach(SelectedBuyer.xp.AKA, function (value, key) {
                            if (key != 'Active') {
                                relatedID = key;
                            }
                        });
                    }

                    if(relatedID) {
                        return OrderCloudSDK.Buyers.Get(relatedID);
                    } else {
                        return null;
                    }
                },
                ToLockRelatedCustomerNumber: function(SelectedBuyer)
                {
                    var toLock = false;
                    if(SelectedBuyer && SelectedBuyer.xp && SelectedBuyer.xp.AKA) {
                        angular.forEach(SelectedBuyer.xp.AKA , function(value, key) {
                            if(key !== 'Active')
                            {
                                if(value === true)
                                {
                                    toLock = true;
                                }
                            }
                        });
                    }
                    return toLock;
                }
            }
        })
        .state('customers.edit.addressEdit', {
            url: '/:addressid/edit',
            templateUrl: 'customers/templates/customerAddressEdit.tpl.html',
            controller: 'CustomerAddressEditCtrl',
            controllerAs: 'customerAddressEdit',
            resolve: {
                SelectedAddress: function($stateParams, $state, OrderCloudSDK, SelectedBuyer) {
                    return OrderCloudSDK.Addresses.Get(SelectedBuyer.ID, $stateParams.addressid)
                        .catch(function() {
                            console.writeline("failed to get address");
                        });
                }
            }
        })
        .state('customers.edit.addressCreate', {
            url: '/address/create',
            templateUrl: 'customers/templates/customerAddressCreate.tpl.html',
            controller: 'CustomerAddressCreateCtrl',
            controllerAs:'customerAddressCreate'
        })
        .state('customers.create', {
            url: '/create',
            templateUrl: 'customers/templates/customerCreate.tpl.html',
            controller: 'CustomerCreateCtrl',
            controllerAs: 'customerCreate'
        })
        .state('customers.assign', {
            url: '/:buyerid/assign',
            templateUrl: 'customers/templates/customerAssign.tpl.html',
            controller: 'CustomerAssignCtrl',
            controllerAs: 'customerAssign',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloudSDK){
                    return OrderCloudSDK.Buyers.Get($stateParams.buyerid)
                },
                EndUsers: function(OrderCloudSDK) {
                    return OrderCloudSDK.Buyers.List();
                }
            }
        })
        .state('customersShared', {
            parent: 'base',
            data: {componentName: 'CustomersShared'},
            url: '/shared',
            templateUrl: 'customers/templates/customersShared.tpl.html',
            controller: 'CustomersSharedCtrl',
            controllerAs: 'customers',
            resolve: {
                Me: function(OrderCloudSDK) {
                    return OrderCloudSDK.Me.Get();
                },
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                BuyerList: function(OrderCloudSDK, Parameters, Me) {
                    var filter = {
                        'ID':Me.xp.WeirGroup.label+'*',
                        'xp.AKA.Active':true
                    };
                    var opts = {
                        search: Parameters.search,
                        page: Parameters.page,
                        pageSize: Parameters.pageSize || 100,
                        filters: filter
                    };
                    return OrderCloudSDK.Buyers.List(opts);
                }
            }
        });
}

function CustomerService($sce, OrderCloudSDK, $exceptionHandler) {
    var _weirGroups = [{id: "1", label: "WVCUK"}, {id: "2", label: "WPIFR"}];
    var _customerTypes = [{id: "1", label: "End User"}, {id: "2", label: "Service Company"}];
    var _customerLanguages = [{id: "fr", label: "French"}, {id: "en", label: "English"}];
    var _componentLabels = {
        en: {
            NewCustomer: "New Customer",
            WeirGroup: "Weir Group",
            CustomerLanguage: "Language setting",
            CustomerType: "Customer Type",
            SelectGroup: "(Select Weir Group)",
            SelectType: "(Select Customer Type)",
            SelectLanguage: "(Select Customer Language)",
            Active: "Active",
            Terms: "Terms and Conditions",
            ShippingDetails: "Shipping Details",
            NewAddress: "New Address",
            AddressId:"Address ID",
            AddressName:"Address Name",
            CompanyName: "Company Name",
            CustomerNumber: "Customer Number",
            FirstName: "First Name",
            LastName:"Last Name",
            StreetOne: "Address line 1",
            StreetTwo: "Address line 2",
            StreetThree: "Address line 3",
            City: "City",
            County: "State / Province / Region",
            PostCode: "Postal code / Zip code",
            Country: "Country",
            PhoneNumber: "Phone Number",
            Primary: "Primary",
            Save: "Save",
            Cancel: "Cancel",
            Edit: "Edit",
            EditAddress: "Edit Address",
            SetInactive: "Set as Inactive",
            AssignmentsFor: "Assignments for",
            ID: "ID",
            Name: "Name",
            Back: "Back",
            UpdateAssignments: "Update Assignments",
            EditCustomer: "Edit Customer",
            CreateNew: "Create New",
            Address: "Address",
            Addresses: "Addresses",
            NoMatch: "No matches found.",
            LoadMore: "Load More",
            Customers: "Customers",
            Users: "Users",
            Search: "Search",
            CarriagePrice: "Carriage Price",
            CarriageHeader: "Carriage",
            StandardCarriageLabel: 'UK Standard carriage (default)',
            CustomerSpecificLabel: 'Customer specific carriage',
            Currency: "GBP"
        },
        fr: {
            NewCustomer: $sce.trustAsHtml("New Customer"),
            WeirGroup: $sce.trustAsHtml("Weir Group"),
            CustomerLanguage: $sce.trustAsHtml("Language setting"),
            CustomerType: $sce.trustAsHtml("Customer Type"),
            SelectGroup: $sce.trustAsHtml("(Select Weir Group)"),
            SelectType: $sce.trustAsHtml("(Select Customer Type)"),
            SelectLanguage: $sce.trustAsHtml("(Select Customer Language)"),
            Active: $sce.trustAsHtml("Active"),
            Terms: $sce.trustAsHtml("Terms and Conditions"),
            ShippingDetails: $sce.trustAsHtml("Shipping Details"),
            NewAddress: $sce.trustAsHtml("New Address"),
            AddressId: $sce.trustAsHtml("Address ID"),
            AddressName: $sce.trustAsHtml("Address Name"),
            CompanyName: $sce.trustAsHtml("Company Name"),
            CustomerNumber: $sce.trustAsHtml("Customer Number"),
            FirstName: $sce.trustAsHtml("First Name"),
            LastName: $sce.trustAsHtml("Last Name"),
            StreetOne: $sce.trustAsHtml("Address line 1"),
            StreetTwo: $sce.trustAsHtml("Address line 2"),
            StreetThree: $sce.trustAsHtml("Address line 3"),
            City: $sce.trustAsHtml("City"),
            County: $sce.trustAsHtml("State / Province / Region"),
            PostCode: $sce.trustAsHtml("Postal code / Zip code"),
            Country: $sce.trustAsHtml("Country"),
            PhoneNumber: $sce.trustAsHtml("Phone Number"),
            Primary: $sce.trustAsHtml("Primary"),
            Save: $sce.trustAsHtml("Save"),
            Cancel: $sce.trustAsHtml("Cancel"),
            Edit: $sce.trustAsHtml("Edit"),
            EditAddress: $sce.trustAsHtml("Edit Address"),
            SetInactive: $sce.trustAsHtml("Set as Inactive"),
            AssignmentsFor: $sce.trustAsHtml("Assignments for"),
            ID: $sce.trustAsHtml("ID"),
            Name: $sce.trustAsHtml("Name"),
            Back: $sce.trustAsHtml("Back"),
            UpdateAssignments: $sce.trustAsHtml("Update Assignments"),
            EditCustomer: $sce.trustAsHtml("Edit Customer"),
            CreateNew: $sce.trustAsHtml("Create New"),
            Address: $sce.trustAsHtml("Address"),
            Addresses: $sce.trustAsHtml("Addresses"),
            NoMatch: $sce.trustAsHtml("No matches found."),
            LoadMore: $sce.trustAsHtml("Load More"),
            Customers: $sce.trustAsHtml("Customers"),
            Users: $sce.trustAsHtml("Users"),
            Search: $sce.trustAsHtml("Search"),
	        CarriagePrice: $sce.trustAsHtml("Carriage Price"),
            CarriageHeader: "Carriage",
            StandardCarriageLabel: 'FR Standard carriage (default)',
            CustomerSpecificLabel: 'Customer specific carriage',
            Currency: "EU"
        }
    };

    function _createBuyer(buyer) {
        return OrderCloudSDK.Buyers.Create(buyer)
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    function _createAddress(address, buyerID){
        return OrderCloudSDK.Addresses.Create(buyerID, address)
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    function _updateAddress(address, buyerID) {
        return OrderCloudSDK.Addresses.Update(buyerID, address.ID, address)
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    function _createGroup(groupName, buyerID) {
        var group = {
            ID: groupName,
            Name: groupName,
            Description: "Standard user group",
            xp:  { }
        };
        var assignment = {
            BuyerID: buyerID,
            SecurityProfileID: groupName,
            UserGroupID: groupName
        };
        return OrderCloudSDK.UserGroups.Create(group)
            .then(function(grp) {
                OrderCloudSDK.SecurityProfiles.SaveAssignment(assignment);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }
    function _assignPlaceholder(buyerID) {
        var assign = {
            BuyerID: buyerID,
            ProductID: "PLACEHOLDER",
            PriceScheduleID: "PLACEHOLDER"
        };
        return OrderCloudSDK.Products.SaveAssignment(assign);
    }

    function _getUpperLanguage(lang) {
        var l = lang || "";
        return l.toUpperCase();
    }

    return {
        WeirGroups: _weirGroups,
        CustomerTypes: _customerTypes,
        CustomerLanguages: _customerLanguages,
        GetUpperLanguage: _getUpperLanguage,
        CreateBuyer: _createBuyer,
        CreateGroup: _createGroup,
        AssignPlaceholderProduct: _assignPlaceholder,
        CreateAddress: _createAddress,
        UpdateAddress: _updateAddress,
        Labels: _componentLabels
    };
}

function CustomerCtrl($state, $ocMedia, OrderCloudSDK, OrderCloudParameters, Parameters, BuyerList, CustomerService, WeirService, CurrentBuyer) {
    var vm = this;
    vm.list = BuyerList;
    vm.parameters = Parameters;
    vm.sortSelection =  Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    vm.labels = CustomerService.Labels[WeirService.Locale()];
    vm.languages = CustomerService.CustomerLanguages;
    vm.GetUpperLanguage = CustomerService.GetUpperLanguage;

    //check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0; //Why parameters instead of vm.parameters?

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the page with new search parameter & reset the page.
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state and reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear the relevant filters, reload the state and reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices.
        vm.filter(true);
    };
    vm.users = function (buyerID) {
        CurrentBuyer.SetBuyerID(buyerID);
        $state.go('users');
    };
    //Conditionally set, reverse, remove the sortBy parameter & reload the state.
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters.
    vm.loadMore = function() {
        var opts = {
	    search: Parameters.search,
	    searchOn: Parameters.searchOn,
	    sortBy: Parameters.sortBy,
	    page: vm.list.Meta.Page + 1,
	    pageSize: Parameters.pageSize || vm.list.Meta.PageSize,
	    filters: Parameters.filters
	};
        return OrderCloudSDK.Buyers.List(opts)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function CustomerEditCtrl($exceptionHandler, $state, $ocMedia, toastr, OrderCloudSDK, SelectedBuyer, WeirGroup, AddressList, CustomerService, Parameters, Underscore, OrderCloudParameters, WeirService, SearchCustomers, RelatedBuyer, ToLockRelatedCustomerNumber) {
    var vm = this;
    //$scope.$state = $state;
    vm.SearchCustomers = SearchCustomers;
    vm.Group = WeirGroup;
	vm.weirGroupID = WeirGroup.ID;
    vm.buyer = SelectedBuyer;
    vm.RelatedBuyer = RelatedBuyer;
    vm.ToLockRelatedBuyer = ToLockRelatedCustomerNumber;
    vm.RelatedBuyerID = RelatedBuyer && RelatedBuyer.ID ? angular.copy(RelatedBuyer.ID) : null;
    vm.relatedWeirGroup = WeirGroup.ID == 'WVCUK' ? 'WPIFR' : 'WVCUK';

    vm.list = AddressList;
    vm.parameters = Parameters;
    vm.labels = CustomerService.Labels[WeirService.Locale()];
    vm.sortSelection =  Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0; //Why parameters instead of vm.parameters?

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the page with new search parameter & reset the page.
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state and reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear the relevant filters, reload the state and reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices.
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state.
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters.
    vm.loadMore = function() {
        var opts = {
	    search: Parameters.search,
	    searchOn: Parameters.searchOn,
	    sortBy: Parameters.sortBy,
	    page: vm.list.Meta.Page + 1,
	    pageSize: Parameters.pageSize || vm.list.Meta.PageSize,
	    filters: Parameters.filters
	};
        return OrderCloudSDK.Buyers.List(opts)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.buyerName = SelectedBuyer.Name;
    vm.WeirGroups = CustomerService.WeirGroups;
    vm.types = CustomerService.CustomerTypes;

    vm.Submit = function() {
        var RelatedBuyerKey = null;

        // If a value is entered in to the related customer number
        if(vm.RelatedBuyerID && vm.RelatedBuyerID !== "") { //Update the current buyer with an AKA relationship.
            RelatedBuyerKey = vm.RelatedBuyerID;
            vm.buyer.xp.AKA = vm.buyer.xp.AKA ? vm.buyer.xp.AKA : {}; //Create the AKA object.
            vm.buyer.xp.AKA.Active = true;
            vm.buyer.xp.AKA[RelatedBuyerKey] = false;
        } else { //Otherwise the relationship was removed or never existed
            vm.buyer.xp.AKA = {};
        }

        OrderCloudSDK.Buyers.Update(vm.buyer.ID, vm.buyer)
            .then(function() {
                if(vm.RelatedBuyer && vm.RelatedBuyer.ID && (vm.RelatedBuyer.ID !== vm.RelatedBuyerID)) { //The related buyer is changed.
                    vm.RelatedBuyer.xp.AKA = {}; //Clear the prior relationship.
                    return OrderCloudSDK.Buyers.Update(vm.RelatedBuyer.ID, vm.RelatedBuyer);
                } else if (vm.RelatedBuyerID){ //very first time a relationship is established
                    return true;
                } else {
                    return null;
                }
            })
            .then(function(OldRelation) { //The old relationship was cleared or never existed.
                if(OldRelation && vm.RelatedBuyerID) {
                    return OrderCloudSDK.Buyers.Get(vm.RelatedBuyerID); //Get the new relationship.
                } else {
                    return null; //There was no old relationship or the relationship was removed. Pass null as the new relationship
                }
            })
            .then(function(NewRelation) {
                if(NewRelation) {
                    vm.RelatedBuyer = NewRelation;
                    vm.RelatedBuyer.xp.AKA = vm.RelatedBuyer.xp.AKA ? vm.RelatedBuyer.xp.AKA : {};
                    vm.RelatedBuyer.xp.AKA.Active = true;
                    vm.RelatedBuyer.xp.AKA[vm.buyer.ID] = true;
                    return OrderCloudSDK.Buyers.Update(vm.RelatedBuyerID,vm.RelatedBuyer);
                } else {
                    return null;
                }
            })
            .then(function() {
                //$state.go('customers', {}, {reload: true});
                toastr.success('Buyer Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.checkForPrimary = function() {
        var primaryAddress = Underscore.find(vm.list.Items, function(item) {
            return item.xp.primary == true;
        });

        if(!primaryAddress || primaryAddress.length < 1) {
            return true;
        } else {
            return false;
        }
    };

    vm.labels = CustomerService.Labels[WeirService.Locale()];

	vm.originalValues = vm.buyer.xp.POContent || {};
	if (vm.weirGroupID == 'WVCUK') {
		vm.edits = {
			CarriagePrice: {
				header: "Carriage Price",
				old: vm.originalValues.CarriagePrice || "",
				newValue: "",
				editable: false
			},
            PriceQuote: {
	            header: "Price Quote",
	            old: vm.originalValues.PriceQuote || "",
	            newValue: "",
	            editable: false
            },
			PaymentTerms: {
	            header: "Payment Terms",
	            old: vm.originalValues.PaymentTerms || "",
	            newValue: "",
	            editable: false
            },
            DeliveryTerms: {
	            header: "Delivery Terms",
	            old: vm.originalValues.DeliveryTerms || "",
	            newValue: "",
	            editable: false
            },
            Packing: {
	            header: "Packing",
	            old: vm.originalValues.Packing || "",
	            newValue: "",
	            editable: false
            }
		};
	} else {
		vm.edits = {
			CarriagePrice: {
				header: "Carriage Price",
				old: vm.originalValues.CarriagePrice || "",
				newValue: "",
				editable: false
			},
			PriceQuote: {
				header: "Price Quote",
				old: vm.originalValues.PriceQuote || "",
				newValue: "",
				editable: false
			},
			PaymentTerms: {
				header: "Payment Terms",
				old: vm.originalValues.PaymentTerms || "",
				newValue: "",
				editable: false
			},
			DeliveryTerms: {
				header: "Delivery Terms",
				old: vm.originalValues.DeliveryTerms || "",
				newValue: "",
				editable: false
			},
			Packing: {
				header: "Packing",
				old: vm.originalValues.Packing || "",
				newValue: "",
				editable: false
			}
		};
	}
	vm.poedit = function (name) {
		if (vm.edits[name]) {
			var tmp = vm.edits[name];
			tmp.editable = true;
			tmp.newValue = tmp.old;
		}
	};
	vm.pocancel = function (name) {
		if (vm.edits[name]) {
			var tmp = vm.edits[name];
			tmp.editable = false;
			tmp.newValue = tmp.old;
		}
	};
	vm.posave = function (name) {
		if (vm.edits[name]) {
			var tmp = vm.edits[name];
			if (tmp.newValue != tmp.old) {
				var upd = {
					xp: {
						POContent: {}
					}
				};
				upd.xp.POContent[name] = tmp.newValue;
				console.log("Update = " + JSON.stringify(upd));
				OrderCloudSDK.Buyers.Patch(vm.buyer.ID, upd)
					.then(function () {
						tmp.old = tmp.newValue;
						toastr.success(tmp.header + ' Updated', 'Success');
						tmp.editable = false;
					})
					.catch(function (err) {
						$exceptionHandler(err);
					});
			} else {
				tmp.editable = false;
			}
		}
	};

    if (!vm.buyer.xp.UseCustomCarriageRate) vm.buyer.xp.UseCustomCarriageRate = false;
    vm.standardRate = vm.Group.xp.StandardCarriage.toFixed(2);
    vm.rateEditable = false;
    vm.customRateStr = (!vm.buyer.xp.UseCustomCarriageRate || !(vm.buyer.xp.CustomCarriageRate)) ? vm.standardRate :
        vm.buyer.xp.CustomCarriageRate.toFixed(2);

	vm.editCarriage = function () {
		vm.rateEditable = true;
		//if (!vm.buyer.xp.CustomCarriageRate) vm.buyer.xp.CustomCarriageRate = vm.Group.xp.StandardCarriage;
	};
    vm.cancelCarriage = function () {
        vm.rateEditable = false;
    };
    vm.saveCarriage = function() {
		var upd = {
			xp: {
				UseCustomCarriageRate: vm.buyer.xp.UseCustomCarriageRate,
				CustomCarriageRate: vm.buyer.xp.CustomCarriageRate
			}
		};
	    OrderCloudSDK.Buyers.Patch(vm.buyer.ID, upd)
		    .then(function() {
			    toastr.success('Buyer Updated', 'Success');
			    vm.rateEditable = false;
		    })
		    .catch(function(ex) {
			    $exceptionHandler(ex);
		    });
    };

}

function CustomerCreateCtrl($q, $state, toastr, CustomerService, OCGeography, WeirService) {
    var vm = this;
    vm.WeirGroups = CustomerService.WeirGroups;
    vm.types = CustomerService.CustomerTypes;
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;
    vm.labels = CustomerService.Labels[WeirService.Locale()];
    vm.Submit = _submit;

    function _submit() {
        var queue = [];
        var dfd = $q.defer();
        var newBuyerID = null;
        vm.address.xp = {};
        vm.address.xp.primary = true;
        vm.address.xp.active = true;
        vm.buyer.xp.Assignments = [];
        vm.buyer.xp = vm.buyer.xp || {};
        vm.buyer.xp.CustomerNumber = vm.CustomerNumber;
        vm.buyer.ID = vm.buyer.xp.WeirGroup.label + "-" + vm.CustomerNumber;
        var buyerPromise = CustomerService.CreateBuyer(vm.buyer);
        buyerPromise.then(function(newBuyer) {
            newBuyerID = newBuyer.ID;
            queue.push(CustomerService.CreateAddress(vm.address, newBuyerID));
            queue.push(CustomerService.CreateGroup("BuyerAdmin", newBuyerID));
            queue.push(CustomerService.CreateGroup("Buyers", newBuyerID));
            queue.push(CustomerService.CreateGroup("Shoppers", newBuyerID));
            queue.push(CustomerService.AssignPlaceholderProduct(newBuyerID));
        });
        queue.push(buyerPromise);

        $q.all(queue).then(function() {
            dfd.resolve();
            $state.go('customers.edit', {"buyerid": newBuyerID}, {reload: true});
            toastr.success('Records Created', 'Success');
        });

        return dfd.promise;
    }
}

function CustomerAddressEditCtrl($exceptionHandler, $state, $scope, toastr, OrderCloudSDK, OCGeography, SelectedBuyer, SelectedAddress, Underscore, WeirService, CustomerService) {
    var vm = this,
        addressID = SelectedAddress.ID;
    vm.addressName = SelectedAddress.AddressName;
    vm.address = SelectedAddress;
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;
    vm.labels = CustomerService.Labels[WeirService.Locale()];
    var original = angular.copy(vm.address); //use this to make the copy if there are dirty items. Set the active to false and primary to false if versioning.

    vm.Submit = _submit;

    function _submit() {
        // Determine what has changed. If only xp.primary is changed do NOT version.
        var dirtyItems = [];
        angular.forEach($scope.AddressEditForm, function(value, key) {
            if(key[0] != '$' && value.$pristine == false) {
                this.push(key);
            }
        }, dirtyItems);

        original.xp = typeof original.xp == "undefined" ? {} : original.xp;
        original.xp.primary = false;
        original.xp.active = false;

        var primaryAddress = null;
        if(Underscore.contains(dirtyItems,"addressPrimaryInput") && vm.address.xp && vm.address.xp.primary == true && dirtyItems.length == 1) {
            OrderCloudSDK.Addresses.List(SelectedBuyer.ID)
                .then(function(resp) {
                    primaryAddress = Underscore.find(resp.Items,function(item) {
                        return item.xp.primary == true;
                    });
                    if (primaryAddress && (primaryAddress.ID !== vm.address.ID)) {
                        primaryAddress.xp.primary = false;
                        return OrderCloudSDK.Addresses.Patch(SelectedBuyer.ID, primaryAddress.ID, primaryAddress)
                            .then(toastr.success("Previous primary address unset.","Primary Address Changed"));
                    } else {
                        return resp;
                    }
                })
                .then(function(resp) {
                    return OrderCloudSDK.Addresses.Update(SelectedBuyer.ID, addressID, vm.address)
                })
                .then(function(resp) {
                    $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                    toastr.success('Address Updated','Success');
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        } else if (Underscore.contains(dirtyItems,"addressPrimaryInput") && vm.address.xp && vm.address.xp.primary == true && dirtyItems.length > 1) { //Address updated, but primary is false.
            OrderCloudSDK.Addresses.List(SelectedBuyer.ID)
                .then(function (resp) {
                    primaryAddress = Underscore.find(resp.Items, function (item) {
                        return item.xp.primary == true;
                    });
                    if (primaryAddress && (primaryAddress.ID !== vm.address.ID)) {
                        primaryAddress.xp.primary = false;
                        return OrderCloudSDK.Addresses.Patch(SelectedBuyer.ID, primaryAddress.ID, primaryAddress)
                            .then(toastr.success("Previous primary address unset.", "Primary Address Changed"));
                    } else {
                        return resp;
                    }
                })
                .then(function (resp) {
                    return OrderCloudSDK.Addresses.Update(SelectedBuyer.ID, original.ID, original)
                })
                .then(function (resp) {
                    vm.address.ID = null;
                    vm.address.xp = typeof vm.address.xp == "undefined" ? {} : vm.address.xp;
                    vm.address.xp.active = true;
                    vm.address.xp.primary = typeof vm.address.xp.primary == "undefined" ? false : vm.address.xp.primary;
                    return OrderCloudSDK.Addresses.Create(SelectedBuyer.ID, vm.address);
                })
                .then(function (resp) {
                    $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                    toastr.success('Address Updated', 'Success');
                })
                .catch(function (ex) {
                    $exceptionHandler(ex);
                });
        } else if (Underscore.contains(dirtyItems,"addressPrimaryInput") && dirtyItems.length == 1) {
            OrderCloudSDK.Addresses.Update(SelectedBuyer.ID, vm.address.ID, vm.address)
                .then(function() {
                    $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                    toastr.success('Address Updated','Success');
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        } else if (dirtyItems.length > 0) {
            OrderCloudSDK.Addresses.Update(SelectedBuyer.ID, original.ID, original)
                .then(function(resp) {
                    vm.address.ID = null;
                    return OrderCloudSDK.Addresses.Create(SelectedBuyer.ID, vm.address);
                })
                .then(function() {
                    $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                    toastr.success('Address Updated','Success');
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
    }

    vm.Delete = function() {
        vm.address.xp = typeof vm.address.xp === "undefined" ? {} : vm.address.xp;
        vm.address.xp.active = false;

        OrderCloudSDK.Addresses.Update(SelectedBuyer.ID, addressID, vm.address)
            .then(function() {
                $state.go('customers.edit', {"buyerid":SelectedBuyer.ID}, {reload: true});
                toastr.success('Address made inactive.', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function CustomerAddressCreateCtrl($exceptionHandler, $state, toastr, OrderCloudSDK, OCGeography, CustomerService, SelectedBuyer, Underscore, WeirService) {
    var vm = this;
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;
    vm.address = {Country: null};
    vm.labels = CustomerService.Labels[WeirService.Locale()];
    vm.address.xp = {};
    vm.address.xp.active = true;
    vm.Submit = _submit;

    function _submit() {
        var primaryAddress = null;
        if(vm.address.xp && (vm.address.xp.primary === true)) {
            OrderCloudSDK.Addresses.List(SelectedBuyer.ID)
                .then(function(resp) {
                    primaryAddress = Underscore.find(resp.Items,function(item) {
                        return item.xp.primary == true;
                    });
                    if (primaryAddress && (primaryAddress.ID !== vm.address.ID)) {
                        primaryAddress.xp.primary = false;
                        return OrderCloudSDK.Addresses.Patch(SelectedBuyer.ID, primaryAddress.ID, primaryAddress)
                            .then(toastr.success("Previous primary address unset.","Primary Address Changed"));
                    } else {
                        return resp;
                    }
                })
                .then(function() {
                    return CustomerService.CreateAddress(vm.address, SelectedBuyer.ID);
                })
                .then(function(newAddress) {
                    return WeirService.AssignAddressToGroups(newAddress.ID, SelectedBuyer.ID); //ToDo Test.
                })
                .then(function(resp) {
                    $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                    toastr.success('Address Created', 'Success');
                    return resp;
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        } else {
            vm.address.xp.primary = false;
            CustomerService.CreateAddress(vm.address, SelectedBuyer.ID)
                .then(function(newAddress) {
                    return WeirService.AssignAddressToGroups(newAddress.ID, SelectedBuyer.ID);
                })
                .then(function(resp) {
                    $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                    toastr.success('Address Created', 'Success');
                    return resp;
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
    }
}

function CustomerAssignCtrl($exceptionHandler, $scope, $state, toastr, Underscore, OrderCloudSDK, SelectedBuyer, EndUsers, Assignments, WeirService, CustomerService) {
    // ToDo: This needs to page!
    var vm = this;
    vm.list = angular.copy(EndUsers);
    vm.endUsers = angular.copy(EndUsers);
    vm.assignments = angular.copy(SelectedBuyer.xp.Customers);
    vm.serviceCompany = SelectedBuyer;
    vm.labels = CustomerService.Labels[WeirService.Locale()];
    EndUsers.Items = Underscore.filter(EndUsers.Items, function(item) {
        return item.Active == true && item.xp.Type.id == 1 && item.xp.WeirGroup.id == vm.serviceCompany.xp.WeirGroup.id;
    });

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        vm.endUsers.Items = Underscore.filter(vm.list.Items, function(item) {
            return item.Active == true && item.xp.Type.id == 1 && item.xp.WeirGroup.id == vm.serviceCompany.xp.WeirGroup.id;
        });
        setSelected();
    });

    vm.setSelected = setSelected;
    function setSelected() {
        var assigned = Assignments.GetAssigned(vm.assignments, 'id');
        angular.forEach(vm.list.Items, function(item) {
            if(assigned.indexOf(item.ID) > -1) {
                item.selected = true;
            }
        })
    }

    vm.saveAssignments = function() {
        var assigned = Underscore.pluck(vm.assignments, 'id');
        var selected = Underscore.pluck(Underscore.where(vm.list.Items, {selected: true}), 'ID');
        var toAdd = Assignments.GetToAssign(vm.list.Items, vm.assignments, 'ID');
        var toUpdate = Underscore.intersection(selected,assigned);
        var toDelete = Assignments.GetToDelete(vm.list.Items,vm.assignments,'id');

        vm.assignments = [];

        angular.forEach(EndUsers.Items, function(Item) {
            if(toAdd.indexOf(Item.ID) > -1) {
                vm.assignments.push({"id":Item.ID,"name":Item.Name});
            } else if(assigned.indexOf(Item.ID) > -1) {
                vm.assignments.push({"id":Item.ID,"name":Item.Name});
            }
        });

        angular.forEach(toDelete, function(value) {
            var elementPosition = vm.assignments.map(function(x) {return x.id;}).indexOf(value);
            vm.assignments.splice(elementPosition, 1);
        });

        vm.serviceCompany.xp.Customers = vm.assignments;

        return OrderCloudSDK.Buyers.Patch(vm.serviceCompany.ID, vm.serviceCompany)
            .then(function() {
                $state.reload($state.current);
                toastr.success('Assignments updated.','Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function CustomersSharedCtrl($state, $ocMedia, OrderCloudSDK, OrderCloudParameters, Parameters, BuyerList, CustomerService, WeirService, CurrentBuyer, Me) {
    var vm = this;

    vm.currentWeirGroup = Me.xp.WeirGroup.label;
    vm.relatedWeirGroup = Me.xp.WeirGroup.label == 'WVCUK' ? 'WPIFR' : 'WVCUK';

    vm.list = BuyerList;
    angular.forEach(vm.list.Items,function(value,key) {
        if(value && value.xp && value.xp.AKA) {
            angular.forEach(value.xp.AKA, function(v,k) {
                if(k != 'Active') {
                    value.SharedCustomer = k;
                    value.SharedPrimary = v ? k.substring(0, 5) : Me.xp.WeirGroup.label;
                }
            });
        }
    });
    vm.parameters = Parameters;
    vm.sortSelection =  Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;
    vm.labels = CustomerService.Labels[WeirService.Locale()];
    vm.languages = CustomerService.CustomerLanguages;
    vm.GetUpperLanguage = CustomerService.GetUpperLanguage;

    //check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0; //Why parameters instead of vm.parameters?

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the page with new search parameter & reset the page.
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state and reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear the relevant filters, reload the state and reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices.
        vm.filter(true);
    };
    vm.users = function (buyerID) {
        CurrentBuyer.SetBuyerID(buyerID);
        $state.go('users');
    };
    //Conditionally set, reverse, remove the sortBy parameter & reload the state.
    vm.updateSort = function(value) {
        value ? angular.noop() : value = vm.sortSelection;
        switch(vm.parameters.sortBy) {
            case value:
                vm.parameters.sortBy = '!' + value;
                break;
            case '!' + value:
                vm.parameters.sortBy = null;
                break;
            default:
                vm.parameters.sortBy = value;
        }
        vm.filter(false);
    };

    //used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters.
    vm.loadMore = function() {
        var opts = {
            search: Parameters.search,
            searchOn: Parameters.searchOn,
            sortBy: Parameters.sortBy,
            page: vm.list.Meta.Page + 1,
            pageSize: Parameters.pageSize || vm.list.Meta.PageSize,
            filters: Parameters.filters
        };
        return OrderCloudSDK.Buyers.List(opts)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}