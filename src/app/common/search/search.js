angular.module('ordercloud-search', []);

angular.module('ordercloud-search')
    .directive('ordercloudSearch', OrdercloudSearch)
    .controller('ordercloudSearchCtrl', OrdercloudSearchController)
    .factory('TrackSearch', TrackSearchService )
	.factory('SearchProducts', SearchProductsService)
    .factory('SearchCustomers', SearchCustomersService)
;

function OrdercloudSearch () {
    return {
        scope: {
            placeholder: '@',
            servicename: '@',
            controlleras: '='
        },
        restrict: 'E',
        templateUrl: 'common/search/templates/search.tpl.html',
        controller: 'ordercloudSearchCtrl',
        controllerAs: 'ocSearch',
        replace: true
    };
}

function OrdercloudSearchController($timeout, $scope, OrderCloudSDK, TrackSearch) {
    $scope.searchTerm = null;
    if ($scope.servicename) {
        var var_name = $scope.servicename.replace(/([a-z])([A-Z])/g, '$1 $2');
        $scope.placeholder = "Search " + var_name + '...';
        var Service = OrderCloudSDK[$scope.servicename];
    }
    var searching;
    $scope.$watch('searchTerm', function(n,o) {
        if (n == o) {
            if (searching) $timeout.cancel(searching);
        } else {
            if (searching) $timeout.cancel(searching);
            searching = $timeout(function() {
                n == '' ? n = null : angular.noop();
                TrackSearch.SetTerm(n);
                if($scope.servicename === 'Orders') {
                    if (!$scope.controlleras.searchfunction) {
                        Service.ListIncoming(null, null, n)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                }
                //else if ($scope.servicename === 'SpendingAccounts') {
                //    if (!$scope.controlleras.searchfunction) {
                //        Service.List(n, null, null, null, null, {'RedemptionCode': '!*'})
                //            .then(function (data){
                //                $scope.controlleras.list = data;
                //            });
                //    }
                //    else {
                //        $scope.controlleras.searchfunction($scope.searchTerm)
                //            .then(function (data){
                //                $scope.controlleras.list = data;
                //            });
                //    }
                //}
                //else if ($scope.servicename === 'Shipments') {
                //    if (!$scope.controlleras.searchfunction) {
                //        Service.List(null, n, null, null)
                //            .then(function (data) {
                //                $scope.controlleras.list = data;
                //            });
                //    }
                //    else {
                //        $scope.controlleras.searchfunction($scope.searchTerm)
                //            .then(function (data){
                //                $scope.controlleras.list = data;
                //            });
                //    }
                //}
                else {
                    if (!$scope.controlleras.searchfunction) {
                        Service.List(n)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                    else {
                        $scope.controlleras.searchfunction($scope.searchTerm)
                            .then(function (data){
                                $scope.controlleras.list = data;
                            });
                    }
                }

            }, 300);
        }
    });
}

function TrackSearchService() {
    var service = {
        SetTerm: _setTerm,
        GetTerm: _getTerm
    };

    var term = null;

    function _setTerm(value) {
        term = value;
    }

    function _getTerm() {
        return term;
    }

    return service;
}

function WeirGroupID(customerID) {
    var id = "";
    if (customerID) {
        var len = customerID.indexOf("-");
        if (len < 0) len = customerID.length;
        id = customerID.substring(0, len);
    }
    return id;
}

//Below is the type-ahead search.
function SearchProductsService(OrderCloudSDK, $q, WeirService) {
    var service = {
    	GetSerialNumbers: _getSerialNumbers,
	    GetTagNumbers: _getTagNumbers,
	    GetPartNumbers: _getPartNumbers
    };

    function _getSerialNumbers(lookForThisPartialSerialNumber, Customer) {
    	var dfd = $q.defer();
        var filters = {
            "xp.SN": lookForThisPartialSerialNumber + "*"
        };
        //UK must have the parent id.
        if(Customer.id.substring(0,5) == "WVCUK") {
            filters.ParentID = Customer.id;
        }
        OrderCloudSDK.Categories.List(WeirGroupID(Customer.id), {
                page: 1,
                pageSize: 50,
                filters: filters,
                depth:Customer.id.substring(0,5) == "WVCUK" ? null:"all",
                catalogID:Customer.id.substring(0,5)
            }).then(function(response) {
                dfd.resolve(WeirService.SetEnglishTranslationParts(response.Items));
            }).catch(function (ex) {
                console.log(JSON.stringify(ex));
            });
	    return dfd.promise;
    }

    function _getTagNumbers(lookForThisPartialTagNumber, Customer) {
    	var dfd = $q.defer();
    	OrderCloudSDK.Categories.List(WeirGroupID(Customer.id), {
    	    page: 1,
    	    pageSize: 50, 
    	    filters: {
    	        "xp.TagNumber": lookForThisPartialTagNumber + "*",
    	        "ParentID": Customer.id
    	    }
        }).then(function(response) {
            dfd.resolve(WeirService.SetEnglishTranslationParts(response.Items));
        });
	    return dfd.promise;
    }

    function _getPartNumbers(lookForThisPartialPartNumber, Customer) {
    	var dfd = $q.defer();
        var partResults = [];
        OrderCloudSDK.Products.List({
            page: 1,
            pageSize: 50, 
            filters: {"Name": lookForThisPartialPartNumber+"*"},
	        catalogID: Customer.id.substring(0,5)
        })
		    .then(function(response) {
		    	if(Customer.id.substring(0,5) == 'WVCUK') {
		    		partResults = response.Items;
		    		return OrderCloudSDK.Products.List({
		    		    page: 1,
		    		    pageSize: 50,
		    		    filters: {
		    		        "xp.AlternatePartNumber": lookForThisPartialPartNumber + '*'
		    		    },
					    catalogID: Customer.id.substring(0,5)
		    		})
					    .then(function(altResponse) {
					    	partResults.push.apply(altResponse.Items);
						    dfd.resolve(WeirService.SetEnglishTranslationParts(partResults));
					    });
			    } else {
			    	dfd.resolve(response.Items);
			    }
		    });
	    return dfd.promise;
    }

    return service;
}

function SearchCustomersService(OrderCloudSDK, $q) {
    var service = {
        GetCustomers: _getCustomers
    };

    function _getCustomers(lookForThisPartialCustomerNumber,weirGroup) {
        var dfd = $q.defer();
        var filter = {
            'ID':weirGroup+'*'
        };
        var opts = {
            search: lookForThisPartialCustomerNumber,
            searchOn: 'ID',
            filters: filter
        };
        OrderCloudSDK.Buyers.List(opts)
            .then(function(buyers) {
                dfd.resolve(buyers.Items);
            })
            .catch(function(ex) {
                console.log(JSON.stringify(ex));
            });

        return dfd.promise;
    }

    return service;
}