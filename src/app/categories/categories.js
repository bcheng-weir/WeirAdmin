angular.module('orderCloud')
    .config(CategoriesConfig)
    .controller('CatalogsCtrl', CatalogsController)
    .controller('CategoriesCtrl', CategoriesController)
    .controller('CategoryEditCtrl', CategoryEditController)
    .controller('CategoryCreateCtrl', CategoryCreateController)
    .controller('CategoryTreeCtrl', CategoryTreeController)
    .controller('CategoryAssignPartyCtrl', CategoryAssignPartyController)
    .controller('CategoryAssignProductCtrl', CategoryAssignProductController)
    .factory('CategoryTreeService', CategoryTreeService)
    .directive('categoryNode', CategoryNode)
    .directive('categoryTree', CategoryTree)
;

function CategoriesConfig($stateProvider) {
    $stateProvider
        .state('catalogs', {
            parent: 'base',
            templateUrl: 'categories/templates/catalogs.tpl.html',
            controller: 'CatalogsCtrl',
            controllerAs: 'catalogs',
            url: '/catalogs',
            data: {componentName: 'Catalogs'},
            resolve: {
                CatalogList: function(OrderCloudSDK) {
                    return OrderCloudSDK.Catalogs.List(null, null, null, null, "Name", {"CategoryCount": ">0"});
                }
            }
        })
        .state('categories', {
            parent: 'base',
            templateUrl: 'categories/templates/categories.tpl.html',
            controller: 'CategoriesCtrl',
            controllerAs: 'categories',
            url: '/categories?catalogId',
            data: {componentName: 'Categories'},
            resolve: {
                Parameters: function($stateParams, OrderCloudParameters) {
                    return OrderCloudParameters.Get($stateParams);
                },
                CategoryList: function(OrderCloudSDK, Parameters) {
                    var parameters = angular.copy(Parameters);
                    parameters.depth = 'all';
                    return OrderCloudSDK.Categories.List(null, null, null, null, null, null, 1, parameters.catalogId);
                }
            }
        })
        .state('categories.tree', {
            url: '/tree',
            templateUrl: 'categories/templates/categoryTree.tpl.html',
            controller: 'CategoryTreeCtrl',
            controllerAs: 'categoryTree',
            resolve: {
                Tree: function(CategoryTreeService) {
                    return CategoryTreeService.GetCategoryTree();
                }
            }
        })
        .state('categories.edit', {
            url: '/:categoryid/edit',
            templateUrl: 'categories/templates/categoryEdit.tpl.html',
            controller: 'CategoryEditCtrl',
            controllerAs: 'categoryEdit',
            resolve: {
                SelectedCategory: function($stateParams, $state, OrderCloudSDK) {
                    return OrderCloudSDK.Categories.Get($stateParams.categoryid).catch(function() {
                        $state.go('^.categories');
                    });
                }
            }
        })
        .state('categories.create', {
            url: '/create',
            templateUrl: 'categories/templates/categoryCreate.tpl.html',
            controller: 'CategoryCreateCtrl',
            controllerAs: 'categoryCreate'
        })
        .state('categories.assignParty', {
            url: '/:categoryid/assign/party',
            templateUrl: 'categories/templates/categoryAssignParty.tpl.html',
            controller: 'CategoryAssignPartyCtrl',
            controllerAs: 'categoryAssignParty',
            resolve: {
                UserGroupList: function(OrderCloudSDK) {
                    return OrderCloudSDK.UserGroups.List();
                },
                AssignedUserGroups: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Categories.ListAssignments($stateParams.categoryid);
                },
                SelectedCategory: function($stateParams, $state, OrderCloudSDK) {
                    return OrderCloudSDK.Categories.Get($stateParams.categoryid).catch(function() {
                        $state.go('^.categories');
                    });
                }
            }
        })
        .state('categories.assignProduct', {
            url: '/:categoryid/assign/product',
            templateUrl: 'categories/templates/categoryAssignProduct.tpl.html',
            controller: 'CategoryAssignProductCtrl',
            controllerAs: 'categoryAssignProd',
            resolve: {
                ProductList: function(OrderCloudSDK) {
                    return OrderCloudSDK.Products.List();
                },
                ProductAssignments: function($stateParams, OrderCloudSDK) {
                    return OrderCloudSDK.Categories.ListProductAssignments($stateParams.categoryid);
                },
                SelectedCategory: function($stateParams, $state, OrderCloudSDK) {
                    return OrderCloudSDK.Categories.Get($stateParams.categoryid).catch(function() {
                        $state.go('^.categories');
                    });
                }
            }
        });
}
function CatalogsController($state, $ocMedia, OrderCloudSDK, CatalogList) {
    var vm = this;
    vm.list = CatalogList;
}

function CategoriesController($state, $ocMedia, OrderCloudSDK, OrderCloudParameters, CategoryList, Parameters) {
    var vm = this;
    vm.list = CategoryList;
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

function CategoryEditController($exceptionHandler, $state, $q, toastr, OrderCloudSDK, SelectedCategory) {
    var vm = this,
        categoryID = SelectedCategory.ID;
    vm.categoryName = SelectedCategory.Name;
    vm.category = SelectedCategory;

    vm.Submit = function() {
        OrderCloudSDK.Categories.Update(categoryID, vm.category)
            .then(function() {
                $state.go('categories', {}, {reload: true});
                toastr.success('Category Updated', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.typeAhead = function(searchTerm) {
        var defd = $q.defer();
        OrderCloudSDK.Categories.List(searchTerm, 1, 100, null, null, null, null, 'all')
            .then(function(data) {
                defd.resolve(data.Items)
            });
        return defd.promise
    };

    vm.Delete = function() {
        OrderCloudSDK.Categories.Delete(SelectedCategory.ID)
            .then(function() {
                $state.go('categories', {}, {reload: true});
                toastr.success('Category Deleted', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };
}

function CategoryCreateController($exceptionHandler, $state, $q, toastr, OrderCloudSDK) {
    var vm = this;
    vm.category = {};

    vm.Submit = function() {
        if (vm.category.ParentID === '') {
            vm.category.ParentID = null;
        }
        OrderCloudSDK.Categories.Create(vm.category)
            .then(function() {
                $state.go('categories', {}, {reload: true});
                toastr.success('Category Created', 'Success');
            })
            .catch(function(ex) {
                $exceptionHandler(ex);
            });
    };

    vm.typeAhead = function(searchTerm) {
        var defd = $q.defer();
        OrderCloudSDK.Categories.List(searchTerm, 1, 100, null, null, null, null, 'all')
            .then(function(data) {
                defd.resolve(data.Items)
            });
        return defd.promise
    };
}

function CategoryTreeController(Tree, CategoryTreeService) {
    var vm = this;
    vm.tree = Tree;

    vm.treeOptions = {
        dropped: function(event) {
            CategoryTreeService.UpdateCategoryNode(event);
        }
    };
}

function CategoryAssignPartyController($scope, toastr, OrderCloudSDK, Assignments, Paging, UserGroupList, AssignedUserGroups, SelectedCategory) {
    var vm = this;
    vm.Category = SelectedCategory;
    vm.list = UserGroupList;
    vm.assignments = AssignedUserGroups;
    vm.saveAssignments = SaveAssignment;
    vm.pagingfunction = PagingFunction;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'UserGroupID');
    });

    function SaveFunc(ItemID) {
        return OrderCloudSDK.Categories.SaveAssignment({
            UserID: null,
            UserGroupID: ItemID,
            CategoryID: vm.Category.ID
        });
    }

    function DeleteFunc(ItemID) {
        return OrderCloudSDK.Categories.DeleteAssignment(vm.Category.ID, null, ItemID);
    }

    function SaveAssignment() {
        toastr.success('Assignment Updated', 'Success');
        return Assignments.SaveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc);
    }

    function AssignmentFunc() {
        return OrderCloudSDK.Categories.ListAssignments(vm.Category.ID, null, vm.assignments.Meta.PageSize);
    }

    function PagingFunction() {
        return Paging.Paging(vm.list, 'UserGroups', vm.assignments, AssignmentFunc);
    }
}

function CategoryAssignProductController($scope, toastr, OrderCloudSDK, Assignments, Paging, ProductList, ProductAssignments, SelectedCategory) {
    var vm = this;
    vm.Category = SelectedCategory;
    vm.list = ProductList;
    vm.assignments = ProductAssignments;
    vm.saveAssignments = SaveAssignment;
    vm.pagingfunction = PagingFunction;

    $scope.$watchCollection(function() {
        return vm.list;
    }, function() {
        Paging.SetSelected(vm.list.Items, vm.assignments.Items, 'ProductID');
    });

    function SaveFunc(ItemID) {
        return OrderCloudSDK.Categories.SaveProductAssignment({
            CategoryID: vm.Category.ID,
            ProductID: ItemID
        });
    }

    function DeleteFunc(ItemID) {
        return OrderCloudSDK.Categories.DeleteProductAssignment(vm.Category.ID, ItemID);
    }

    function SaveAssignment() {
        toastr.success('Assignment Updated', 'Success');
        return Assignments.SaveAssignments(vm.list.Items, vm.assignments.Items, SaveFunc, DeleteFunc, 'ProductID');
    }

    function AssignmentFunc() {
        return OrderCloudSDK.Categories.ListProductAssignments(vm.Category.ID, null, vm.assignments.Meta.PageSize);
    }

    function PagingFunction() {
        return Paging.Paging(vm.list, 'Products', vm.assignments, AssignmentFunc);
    }
}

function CategoryTree() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            tree: '='
        },
        template: "<ul><category-node ng-repeat='node in tree' node='node'></category-node></ul>"
    };
}

function CategoryNode($compile) {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            node: '='
        },
        template: '<li><a ui-sref="base.adminCategories.edit({id:node.ID})" ng-bind-html="node.Name"></a></li>',
        link: function(scope, element) {
            if (angular.isArray(scope.node.children)) {
                element.append("<category-tree tree='node.children' />");
                $compile(element.contents())(scope);
            }
        }
    };
}

function CategoryTreeService($q, Underscore, OrderCloudSDK) {
    return {
        GetCategoryTree: tree,
        UpdateCategoryNode: update
    };

    function tree() {
        var tree = [];
        var deferred = $q.defer();
        OrderCloudSDK.Categories.List(null, 1, 100, null, null, null, null, 'all')
            .then(function(list) {
            angular.forEach(Underscore.where(list.Items, {ParentID: null}), function(node) {
                tree.push(getnode(node));
            });

            function getnode(node) {
                var children = Underscore.where(list.Items, {ParentID: node.ID});
                if (children.length > 0) {
                    node.children = children;
                    angular.forEach(children, function(child) {
                        return getnode(child);
                    });
                } else {
                    node.children = [];
                }
                return node;
            }

            deferred.resolve(tree);
        });
        return deferred.promise;
    }

    function update(event) {
        var sourceParentNodeList = event.source.nodesScope.$modelValue,
            destParentNodeList = event.dest.nodesScope.$modelValue,
            masterDeferred = $q.defer();

        updateNodeList(destParentNodeList).then(function() {
            if (sourceParentNodeList != destParentNodeList) {
                if (sourceParentNodeList.length) {
                    updateNodeList(sourceParentNodeList).then(function() {
                        updateParentID().then(function() {
                            masterDeferred.resolve();
                        });
                    });
                } else {
                    updateParentID().then(function() {
                        masterDeferred.resolve();
                    });
                }
            }
        });

        function updateNodeList(nodeList) {
            var deferred = $q.defer(),
                nodeQueue = [];
            angular.forEach(nodeList,function(cat, index) {
                nodeQueue.push((function() {
                    return OrderCloudSDK.Categories.Patch(cat.ID, {ListOrder: index});
                }));
            });

            var queueIndex = 0;
            function run(i) {
                nodeQueue[i]().then(function() {
                    queueIndex++;
                    if (queueIndex < nodeQueue.length) {
                        run(queueIndex);
                    } else {
                        deferred.resolve();
                    }
                });
            }
            run(queueIndex);

            return deferred.promise;
        }

        function updateParentID() {
            var deferred = $q.defer(),
                parentID;

            if (event.dest.nodesScope.node) {
                parentID = event.dest.nodesScope.node.ID;
            } else {
                parentID = null;
            }
            event.source.nodeScope.node.ParentID = parentID;
            OrderCloudSDK.Categories.Update(event.source.nodeScope.node.ID, event.source.nodeScope.node)
                .then(function() {
                    deferred.resolve();
                });
            return deferred.promise;
        }

        return masterDeferred.promise;
    }
}
