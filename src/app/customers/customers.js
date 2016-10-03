angular.module('orderCloud')
    .config(CustomerConfig)
    .factory('CustomerService', CustomerService)
    .controller('CustomerCtrl', CustomerCtrl)
    .controller('CustomerEditCtrl', CustomerEditCtrl)
    .controller('CustomerAddressEditCtrl', CustomerAddressEditCtrl)
    .controller('CustomerCreateCtrl', CustomerCreateCtrl)
    .controller('CustomerAddressCreateCtrl', CustomerAddressCreateCtrl)
;

function CustomerConfig($stateProvider) {
    $stateProvider
        .state('customers', {
            parent: 'base',
            templateUrl: 'customers/templates/customers.tpl.html',
            controller: 'CustomerCtrl',
            controllerAs: 'customers',
            url: '/customers?search&page&pageSize',
            data: {componentName: 'Customers'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                BuyerList: function(OrderCloud, Parameters) {
                    return OrderCloud.Buyers.List(Parameters.search, Parameters.page, Parameters.pageSize);
                }
            }
        })
        .state('customers.edit', {
            url: '/:buyerid/edit?search&page&pageSize&searchOn&sortBy&filters   ',
            templateUrl: 'customers/templates/customerEdit.tpl.html',
            controller: 'CustomerEditCtrl',
            controllerAs: 'customerEdit',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloud){
                    return OrderCloud.Buyers.Get($stateParams.buyerid)
                },
                AddressList: function(OrderCloud, $stateParams, Parameters) {
                    return OrderCloud.Addresses.List(null,null,null,null,null,null,$stateParams.buyerid);
                }
            }
        })
        .state('customers.edit.addressEdit', {
            url: '/:buyerid/edit/:addressid',
            templateUrl: 'customers/templates/addressEdit.tpl.html',
            controller: 'CustomerAddressEditCtrl',
            controllerAs: 'customerAddressEdit',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloud){
                    return OrderCloud.Buyers.Get($stateParams.buyerid)
                },
                SelectedAddress: function($stateParams, $state, OrderCloud) {
                    return OrderCloud.Addresses.Get($stateParams.addressid,$stateParams.buyerid).catch(function() {
                        console.writeline("failed to get address");
                        //$state.go('^');
                    });
                }
            }
        })
        .state('customers.edit.addressCreate', {
            url: '/:buyerid/edit/address/create',
            templateUrl: 'customers/templates/addressCreate.tpl.html',
            controller: 'CustomerAddressCreateCtrl',
            controllerAs:'customerAddressCreate',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloud) {
                    return OrderCloud.Buyers.Get($stateParams.buyerid)
                }
            }
        })
        .state('customers.create', {
            url: '/create',
            templateUrl: 'customers/templates/customerCreate.tpl.html',
            controller: 'CustomerCreateCtrl',
            controllerAs: 'customerCreate'
        });

}

function CustomerService($q, $state, OrderCloud, toastr, Underscore, $exceptionHandler) {
    var _divisions = [{id: "1", label: "UK"}, {id: "2", label: "France"}];
    var _customerTypes = [{id: "1", label: "End User"}, {id: "2", label: "Service Company"}];

    function AbortError() {}

    function _createBuyer(buyer) {
        return OrderCloud.Buyers.Create(buyer)
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    function _createAddress(address, buyer){
        address.xp = {};
        address.xp.primary = true;
        return OrderCloud.Addresses.Create(address, buyer.ID)
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    function _updatePrimaryAddress(buyer, address) {
        // if vm.address.xp && vm.address.xp.primary === true
        // OrderCloud.Addresses.List(null,null,null,null,null,null,SelectedBuyer.ID)
        // then find the one already marked as primary. if its ID === vm.addressid continue
        // else, update currentPrimary to have xp.primary = false
        // perform normal address.update.
        var primaryAddress = null;
        if(address.xp && address.xp.primary === true)
        {
            OrderCloud.Addresses.List(null,null,null,null,null,null,buyer.ID)
                .then(function(resp) {
                    primaryAddress = Underscore.find(resp.Items,function(item) {
                        return item.xp.primary == true;
                    });
                    if (primaryAddress && (primaryAddress.ID === address.ID)) {
                        throw new AbortError(); // Do not perform the update.
                    } else {
                        primaryAddress.xp.primary = false;
                        return true;
                    }
                })
                .then(function() {
                    OrderCloud.Addresses.Patch(primaryAddress.ID, primaryAddress, buyer.ID);
                })
                .then(function(resp) {
                    toastr.success("Old primary address unset.","Primary Address Changed");
                })
                .catch(function(ex) {
                    $exceptionHandler(ex);
                });
        }
    }

    return {
        Divisions: _divisions,
        CustomerTypes: _customerTypes,
        UpdatePrimaryAddress: _updatePrimaryAddress,
        CreateBuyer: _createBuyer,
        CreateAddress: _createAddress
    };
}

function CustomerCtrl($state, $ocMedia, OrderCloud, OrderCloudParameters, Parameters, BuyerList) {
    var vm = this;
    vm.list = BuyerList;
    vm.parameters = Parameters;
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
        return OrderCloud.Buyers.List(Parameters.search, vm.list.Meta.Page + 1, parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function CustomerEditCtrl($exceptionHandler, $scope, $state, $ocMedia, toastr, OrderCloud, SelectedBuyer, AddressList, CustomerService, Parameters) {
    var vm = this;
    $scope.$state = $state;
    $scope.$watch('$state.$current.locals.globals.AddressList', function(AddressList) {
        vm.list = AddressList;
    });
    vm.buyer = SelectedBuyer;
    //vm.list = AddressList;
    vm.parameters = Parameters;
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
        return OrderCloud.Buyers.List(Parameters.search, vm.list.Meta.Page + 1, parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };

    vm.buyerName = SelectedBuyer.Name;
    vm.divisions = CustomerService.Divisions;
    vm.types = CustomerService.CustomerTypes;

    vm.Submit = function() {
        OrderCloud.Buyers.Update(vm.buyer, SelectedBuyer.ID)
            .then(function() {
                $state.go('customers', {}, {reload: true});
                toastr.success('Buyer Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function CustomerCreateCtrl($q, $exceptionHandler, $scope, $state, toastr, OrderCloud, CustomerService, OCGeography) {
    var vm = this;
    vm.divisions = CustomerService.Divisions;
    vm.types = CustomerService.CustomerTypes;
    vm.address = {
        Country: 'US' //This defaults create addresses to the US. Change to UK?
    };
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    //Watch the country.
    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        vm.address.State = null; //If the country changes, null the state.
    });

    vm.Submit = _submit;

    function _submit() {
        var queue = [];
        var dfd = $q.defer();
        var newBuyerID = null;

        var buyerPromise = CustomerService.CreateBuyer(vm.buyer);
        var addressPromise = buyerPromise.then(function(newBuyer) {
            newBuyerID = newBuyer.ID;
            return CustomerService.CreateAddress(vm.address, newBuyer)
        });

        queue.push(buyerPromise);
        queue.push(addressPromise);

        $q.all(queue).then(function() {
            dfd.resolve();
            $state.go('customers.edit', {"buyerid": newBuyerID}, {reload: true});
            toastr.success('Records Created', 'Success');
        });

        return dfd.promise;
    }
}

function CustomerAddressEditCtrl($q, $exceptionHandler, $state, $scope, toastr, OrderCloud, OCGeography, CustomerService, SelectedBuyer, SelectedAddress) {
    var vm = this,
        addressID = SelectedAddress.ID;
    vm.addressName = SelectedAddress.AddressName;
    vm.address = SelectedAddress;
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        //vm.address.State = null;
    });

    vm.Submit = _submit;

    function _submit() {
        var queue = [];
        var dfd = $q.defer();
        queue.push(CustomerService.UpdatePrimaryAddress(SelectedBuyer, vm.address));
        queue.push(OrderCloud.Addresses.Update(addressID, vm.address, SelectedBuyer.ID));
        $q.all(queue).then(function() {
                dfd.resolve();
                $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                toastr.success('Address Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });

        return dfd.promise;
    }

    vm.Delete = function() {
        OrderCloud.Addresses.Delete(SelectedAddress.ID, SelectedBuyer.ID)
            .then(function() {
                $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                toastr.success('Address Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function CustomerAddressCreateCtrl($q, $exceptionHandler, $scope, $state, toastr, OrderCloud, OCGeography, CustomerService, SelectedBuyer) {
    var vm = this;
    vm.address = {
        Country: 'US' // this is to default 'create' addresses to the country US
    };
    vm.countries = OCGeography.Countries;
    vm.states = OCGeography.States;

    $scope.$watch(function() {
        return vm.address.Country
    }, function() {
        vm.address.State = null;
    });

    vm.Submit = _submit;

    function _submit() {
        var queue = [];
        var dfd = $q.defer();
        queue.push(CustomerService.UpdatePrimaryAddress(SelectedBuyer, vm.address));
        queue.push(OrderCloud.Addresses.Create(vm.address, SelectedBuyer.ID));
        $q.all(queue).then(function() {
                dfd.resolve();
                $state.go('customers.edit', {"buyerid": SelectedBuyer.ID}, {reload: true});
                toastr.success('Address Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });

        return dfd.promise;
    }
}