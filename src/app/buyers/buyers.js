angular.module('orderCloud')
    .config(BuyerConfig)
    .factory('BuyerService', BuyerService)
    .controller('BuyerCtrl', BuyerController)
    .controller('BuyerEditCtrl', BuyerEditController)
    .controller('BuyerCreateCtrl', BuyerCreateController)
;

function BuyerConfig($stateProvider) {
    $stateProvider
        .state('buyers', {
            parent: 'base',
            templateUrl: 'buyers/templates/buyers.tpl.html',
            controller: 'BuyerCtrl',
            controllerAs: 'buyers',
            url: '/buyers?search&page&pageSize&searchOn&sortBy',
            data: {componentName: 'Buyers'},
            resolve : {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                BuyerList: function(OrderCloudSDK, Parameters) {
                    return OrderCloudSDK.Buyers.List(Parameters.search, Parameters.page, Parameters.pageSize || 12/*, Parameters.searchOn, Parameters.sortBy, Parameters.filters*/);
                    //Commenting out params that don't exist yet in the API
                }
            }
        })
        .state('buyers.edit', {
            url: '/:buyerid/edit',
            templateUrl: 'buyers/templates/buyerEdit.tpl.html',
            controller: 'BuyerEditCtrl',
            controllerAs: 'buyerEdit',
            resolve: {
                SelectedBuyer: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Buyers.Get($stateParams.buyerid);
                }
            }
        })
        .state('buyers.create', {
            url: '/create',
            templateUrl: 'buyers/templates/buyerCreate.tpl.html',
            controller: 'BuyerCreateCtrl',
            controllerAs: 'buyerCreate'
        });
}


function BuyerService($q, $state, OrderCloudSDK) {
    var _divisions = [{id: "1", label: "UK"}, {id: "2", label: "France"}];
    var _customerTypes = [{id: "1", label: "End User"}, {id: "2", label: "Service Company"}];

    function _createBuyerAndAddress(buyer, address) {
       address.xp.IsPrimary = true;
       return OrderCloudSDK.Buyers.Create(buyer)
            .then(function(res) {
		    OrderCloudSDK.Addresses.Create(address, buyer.ID);
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    }

    return {
        Divisions: _divisions,
        CustomerTypes: _customerTypes,
        CreateBuyerWithPrimaryAddress: _createBuyerAndAddress
    };
}

function BuyerController($state, $ocMedia, OrderCloudSDK, OrderCloudParameters, Parameters, BuyerList) {
    var vm = this;
    vm.list = BuyerList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
    vm.showFilters = vm.filtersApplied;

    //Check if search was used
    vm.searchResults = Parameters.search && Parameters.search.length > 0;

    //Reload the state with new parameters
    vm.filter = function(resetPage) {
        $state.go('.', OrderCloudParameters.Create(vm.parameters, resetPage));
    };

    //Reload the state with new search parameter & reset the page
    vm.search = function() {
        vm.filter(true);
    };

    //Clear the search parameter, reload the state & reset the page
    vm.clearSearch = function() {
        vm.parameters.search = null;
        vm.filter(true);
    };

    //Clear relevant filters, reload the state & reset the page
    vm.clearFilters = function() {
        vm.parameters.filters = null;
        $ocMedia('max-width:767px') ? vm.parameters.sortBy = null : angular.noop(); //Clear out sort by on mobile devices
        vm.filter(true);
    };

    //Conditionally set, reverse, remove the sortBy parameter & reload the state
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

    //Used on mobile devices
    vm.reverseSort = function() {
        Parameters.sortBy.indexOf('!') == 0 ? vm.parameters.sortBy = Parameters.sortBy.split('!')[1] : vm.parameters.sortBy = '!' + Parameters.sortBy;
        vm.filter(false);
    };

    //Reload the state with the incremented page parameter
    vm.pageChanged = function() {
        $state.go('.', {page:vm.list.Meta.Page});
    };

    //Load the next page of results with all of the same parameters
    vm.loadMore = function() {
        return OrderCloudSDK.Buyers.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function BuyerEditController($exceptionHandler, $state, toastr, OrderCloudSDK, SelectedBuyer) {
    var vm = this;
    vm.buyer = SelectedBuyer;
    vm.buyerName = SelectedBuyer.Name;
    vm.divisions = BuyerService.Divisions;
    vm.types = BuyerService.CustomerTypes;

    vm.Submit = function() {
        OrderCloudSDK.Buyers.Update(vm.buyer, SelectedBuyer.ID)
            .then(function() {
                $state.go('buyers', {}, {reload: true});
                toastr.success('Buyer Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function BuyerCreateController($exceptionHandler, $state, toastr, OrderCloudSDK, BuyerService) {
    var vm = this;
    vm.divisions = BuyerService.Divisions;
    vm.types = BuyerService.CustomerTypes;
    vm.primaryAddress = {};

    vm.Submit = function() {
        OrderCloudSDK.Buyers.Create(vm.buyer)
	// BuyerService.CreateBuyerWithPrimaryAddress(vm.buyer, vm.primaryAddress)
            .then(function() {
                $state.go('buyers', {}, {reload: true});
                toastr.success('Buyer Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}
