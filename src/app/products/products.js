angular.module('orderCloud')
    .config(ProductsConfig)
    .controller('ProductsCtrl', ProductsController)
    .controller('ProductEditCtrl', ProductEditController)
    .controller('ProductCreateCtrl', ProductCreateController)
    .controller('ProductAssignmentsCtrl', ProductAssignmentsController)
    .controller('ProductCreateAssignmentCtrl', ProductCreateAssignmentController)
;

function ProductsConfig($stateProvider) {
    $stateProvider
        .state('products', {
            parent: 'base',
            templateUrl: 'products/templates/products.tpl.html',
            controller: 'ProductsCtrl',
            controllerAs: 'products',
            url: '/products?from&to&search&page&pageSize&searchOn&sortBy&filters',
            data: {componentName: 'Products'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                ProductList: function(OrderCloudSDK, Parameters) {
                    return OrderCloudSDK.Products.List(Parameters.search, Parameters.page, Parameters.pageSize || 12, Parameters.searchOn, Parameters.sortBy, Parameters.filters);
                }
            }
        })
        .state('products.edit', {
            url: '/:productid/edit',
            templateUrl: 'products/templates/productEdit.tpl.html',
            controller: 'ProductEditCtrl',
            controllerAs: 'productEdit',
            resolve: {
                SelectedProduct: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Products.Get($stateParams.productid);
                }
            }
        })
        .state('products.create', {
            url: '/create',
            templateUrl: 'products/templates/productCreate.tpl.html',
            controller: 'ProductCreateCtrl',
            controllerAs: 'productCreate'
        })
        .state('products.assignments', {
            templateUrl: 'products/templates/productAssignments.tpl.html',
            controller: 'ProductAssignmentsCtrl',
            controllerAs: 'productAssignments',
            url: '/:productid/assignments',
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                SelectedProduct: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Products.Get($stateParams.productid);
                },
                Assignments: function($stateParams, OrderCloudSDK, Parameters) {
                    return OrderCloudSDK.Products.ListAssignments($stateParams.productid, Parameters.productID, Parameters.userID, Parameters.userGroupID, Parameters.level, Parameters.priceScheduleID, Parameters.page, Parameters.pageSize);
                }
            }
        })
        .state('products.createAssignment', {
            url: '/:productid/assignments/new',
            templateUrl: 'products/templates/productCreateAssignment.tpl.html',
            controller: 'ProductCreateAssignmentCtrl',
            controllerAs: 'productCreateAssignment',
            resolve: {
                UserGroupList: function(OrderCloudSDK) {
                    return OrderCloudSDK.UserGroups.List(null, 1, 20);
                },
                PriceScheduleList: function(OrderCloudSDK) {
                    return OrderCloudSDK.PriceSchedules.List(null,1, 20);
                }
            }
        });
}

function ProductsController($state, $ocMedia, OrderCloudSDK, OrderCloudParameters, ProductList, Parameters) {
    var vm = this;
    vm.list = ProductList;
    vm.parameters = Parameters;
    vm.sortSelection = Parameters.sortBy ? (Parameters.sortBy.indexOf('!') == 0 ? Parameters.sortBy.split('!')[1] : Parameters.sortBy) : null;

    //Check if filters are applied
    vm.filtersApplied = vm.parameters.filters || vm.parameters.from || vm.parameters.to || ($ocMedia('max-width:767px') && vm.sortSelection); //Sort by is a filter on mobile devices
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
        vm.parameters.from = null;
        vm.parameters.to = null;
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
        return OrderCloudSDK.Products.List(Parameters.search, vm.list.Meta.Page + 1, Parameters.pageSize || vm.list.Meta.PageSize, Parameters.searchOn, Parameters.sortBy, Parameters.filters)
            .then(function(data) {
                vm.list.Items = vm.list.Items.concat(data.Items);
                vm.list.Meta = data.Meta;
            });
    };
}

function ProductEditController($exceptionHandler, $state, toastr, OrderCloudSDK, SelectedProduct) {
    var vm = this,
        productid = angular.copy(SelectedProduct.ID);
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.product = SelectedProduct;

    vm.Submit = function() {
        OrderCloudSDK.Products.Update(productid, vm.product)
            .then(function() {
                $state.go('products', {}, {reload: true});
                toastr.success('Product Updated', 'Success')
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    vm.Delete = function() {
        OrderCloudSDK.Products.Delete(productid)
            .then(function() {
                $state.go('products', {}, {reload: true});
                toastr.success('Product Deleted', 'Success')
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}

function ProductCreateController($exceptionHandler, $state, toastr, OrderCloudSDK) {
    var vm = this;
    vm.product = {};

    vm.Submit = function() {
        OrderCloudSDK.Products.Create(vm.product)
            .then(function() {
                $state.go('products', {}, {reload: true});
                toastr.success('Product Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };
}

function ProductAssignmentsController($exceptionHandler, $stateParams, $state, toastr, OrderCloudSDK, Assignments, SelectedProduct) {
    var vm = this;
    vm.list = Assignments.Items;
    vm.productID = $stateParams.productid;
    vm.productName = angular.copy(SelectedProduct.Name);
    vm.pagingfunction = PagingFunction;

    vm.Delete = function(scope) {
        OrderCloudSDK.Products.DeleteAssignment($stateParams.productid, null, scope.assignment.UserGroupID)
            .then(function() {
                $state.reload();
                toastr.success('Product Assignment Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex)
            });
    };

    function PagingFunction() {
        if (vm.list.Meta.Page < vm.list.Meta.TotalPages) {
            OrderCloudSDK.Products.ListAssignments($stateParams.productid, null, null, null, null, vm.list.Meta.Page + 1, vm.list.Meta.PageSize)
                .then(function(data) {
                    vm.list.Items = [].concat(vm.list.Items, data.Items);
                    vm.list.Meta = data.Meta;
                });
        }
    }
}

function ProductCreateAssignmentController($q, $stateParams, $state, Underscore, toastr, OrderCloudSDK, UserGroupList, PriceScheduleList, CurrentBuyer) {
    var vm = this;
    vm.list = UserGroupList;
    vm.priceSchedules = PriceScheduleList.Items;

    vm.assignBuyer = false;
    vm.model = {
        ProductID:$stateParams.productid,
        BuyerID: CurrentBuyer.GetBuyerID(),
        UserGroupID: null,
        StandardPriceScheduleID: null,
        ReplenishmentPriceScheduleID: null
    };

    vm.toggleReplenishmentPS = function(id) {
        vm.model.ReplenishmentPriceScheduleID == id ? vm.model.ReplenishmentPriceScheduleID = null : vm.model.ReplenishmentPriceScheduleID = id;
    };

    vm.toggleStandardPS = function(id) {
        vm.model.StandardPriceScheduleID == id ? vm.model.StandardPriceScheduleID = null : vm.model.StandardPriceScheduleID = id;
    };

    vm.submit = function() {
        if (!(vm.model.StandardPriceScheduleID || vm.model.ReplenishmentPriceScheduleID) || (!vm.assignBuyer && !Underscore.where(vm.list.Items, {selected:true}).length)) return;
        if (vm.assignBuyer) {
            OrderCloudSDK.Products.SaveAssignment(vm.model)
                .then(function() {
                    $state.go('products.assignments', {productid:$stateParams.productid});
                });
        } else {
            var assignmentQueue = [];
            angular.forEach(Underscore.where(vm.list.Items, {selected: true}), function(group) {
                assignmentQueue.push((function() {
                    var df = $q.defer();
                    var assignment = angular.copy(vm.model);
                    assignment.UserGroupID = group.ID;
                    OrderCloudSDK.Products.SaveAssignment(assignment)
                        .then(function() {
                            df.resolve();
                        });
                    return df.promise;
                })());
            });
            $q.all(assignmentQueue).then(function() {
                $state.go('products.assignments', {productid:$stateParams.productid});
                toastr.success('Assignment Updated', 'Success');
            });
        }
    };
}

