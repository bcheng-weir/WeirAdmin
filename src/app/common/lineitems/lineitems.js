angular.module('ordercloud-lineitems', [])
    .factory('LineItemHelpers', LineItemFactory)
    .controller('LineItemModalCtrl', LineItemModalController)
;

function LineItemFactory($rootScope, $q, $state, $uibModal, Underscore, OrderCloudSDK, CurrentOrder, buyernetwork) {
    return {
        SpecConvert: _specConvert,
        RemoveItem: _removeItem,
        UpdateQuantity: _updateQuantity,
        GetProductInfo: _getProductInfo,
        GetBlankProductInfo: _getBlankProductInfo,
        CustomShipping: _customShipping,
        UpdateShipping: _updateShipping,
        ListAll: _listAll
    };
    var isImpersonating = typeof(OrderCloudSDK.GetImpersonationToken()) != 'undefined' ? true : false;
    var direction = isImpersonating == true ? 'Outgoing' : 'Incoming';
    function _specConvert(specs) {
        var results = [];
        angular.forEach(specs, function (spec) {
            var spec_to_push = {SpecID: spec.ID};
            if (spec.Options.length > 0) {
                if (spec.DefaultOptionID) {
                    spec_to_push.OptionID = spec.DefaultOptionID;
                }
                if (spec.OptionID) {
                    spec_to_push.OptionID = spec.OptionID;
                }
                if (spec.Value) {
                    spec_to_push.Value = spec.Value;
                }
            }
            else {
                spec_to_push.Value = spec.Value || spec.DefaultValue || null;
            }
            results.push(spec_to_push);
        });
        return results;
    }

    function _removeItem(Order, LineItem) {
        OrderCloudSDK.LineItems.Delete(direction, Order.ID, LineItem.ID)
            .then(function () {
                var filter = {
                    'Order.xp.BuyerID' : Order.xp.BuyerID
                };
                // If all line items are removed delete the order.
                OrderCloudSDK.LineItems.List(direction, Order.ID, {'filters' : filter})
                    .then(function (data) {
                        if (!data.Items.length) {
                            CurrentOrder.Remove();
                            OrderCloudSDK.Orders.Delete(direction, Order.ID, Order.xp.BuyerID)
                                .then(function () {
                                    $state.reload();
                                    $rootScope.$broadcast('OC:RemoveOrder');
                                });
                        }
                        else {
                            $state.reload();
                        }
                    });
            });
    }

    function _updateQuantity(Order, LineItem) {
        if (LineItem.Quantity > 0) {
            OrderCloudSDK.LineItems.Patch(direction, Order.ID, LineItem.ID, {Quantity: LineItem.Quantity})
                .then(function () {
                    $rootScope.$broadcast('OC:UpdateOrder', Order.ID);
                    $rootScope.$broadcast('OC:UpdateLineItem',Order);
                });
        }
    }

    function _getProductInfo(LineItems, Order) {
        var li = LineItems.Items || LineItems;
        var productIDs = Underscore.uniq(Underscore.pluck(li, 'ProductID'));
        var dfd = $q.defer();
        var queue = [];
	    var impersonation = {
		    ClientID: buyernetwork,
		    Claims: []
	    };

	    OrderCloudSDK.Users.Get(Order.xp.BuyerID,Order.FromUserID)
		    .then(function(buyer) {
			    // Get an access token for impersonation.
			    impersonation.Claims = buyer.AvailableRoles;
			    return OrderCloudSDK.Users.GetAccessToken(Order.xp.BuyerID, Order.FromUserID, impersonation);
		    })
		    .then(function(data) {
			    // Set the local impersonation token so that As() can be used.
			    return OrderCloudSDK.SetImpersonationToken(data['access_token']);
		    })
		    .then(function() {
			    angular.forEach(productIDs, function (productid) {
				    if(productid != "PLACEHOLDER") {
					    queue.push(OrderCloudSDK.As().Me.GetProduct(productid));
					    //queue.push(OrderCloudSDK.Products.Get(productid));
				    }
			    });
			    $q.all(queue)
				    .then(function (results) {
					    angular.forEach(li, function (item) {
						    if(item.ProductID != "PLACEHOLDER") {
							    item.Product = angular.copy(Underscore.where(results, {ID: item.ProductID})[0]);
						    }
					    });
					    dfd.resolve(li);
				    });
		    })
		    .then(function() {
			    // Remove the impersonation token.
			    return OrderCloudSDK.RemoveImpersonationToken();
		    });


        return dfd.promise;
    }

    function _getBlankProductInfo(LineItems) {
    	var li = LineItems || LineItems.Items;

	    angular.forEach(li, function(item) {
	    	if(item.ProductID == "PLACEHOLDER") {
	    		item.Product = {
				    "Name": item.xp.ProductName,
				    "Description": item.xp.Description,
				    "xp": {
					    "ReplacementSchedule": item.xp.ReplacementSchedule,
					    "LeadTime": item.xp.LeadTime
				    }
			    };
		    }
	    });

	    return li;
    }

    function _customShipping(Order, LineItem) {
        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'common/lineitems/templates/shipping.tpl.html',
            controller: 'LineItemModalCtrl',
            controllerAs: 'liModal',
            size: 'lg'
        });

        modalInstance.result
            .then(function (address) {
                address.ID = Math.floor(Math.random() * 1000000).toString();
                OrderCloudSDK.LineItems.SetShippingAddress(direction, Order.ID, LineItem.ID, address)
                    .then(function () {
                        $rootScope.$broadcast('LineItemAddressUpdated', LineItem.ID, address);
                    });
            });
    }

    function _updateShipping(Order, LineItem, AddressID) {
        OrderCloudSDK.Addresses.Get(Order.xp.BuyerID, AddressID)
            .then(function (address) {
                OrderCloudSDK.LineItems.SetShippingAddress(direction, Order.ID, LineItem.ID, address);
                $rootScope.$broadcast('LineItemAddressUpdated', LineItem.ID, address);
            });
    }

    function _listAll(orderID, buyerID) {
        var li;
        var dfd = $q.defer();
        var queue = [];
        var filter = {
        'filters' : {'buyerID' : buyerID},
            'page': 1,
            'pageSize' : 100
        };
        OrderCloudSDK.LineItems.List(direction, orderID, filter)
            .then(function (data) {
                li = data;
                if (data.Meta.TotalPages > data.Meta.Page) {
                    var page = data.Meta.Page;
                    while (page < data.Meta.TotalPages) {
                        page += 1;
                        var filter = {
                            'page' : page,
                            'pageSize' : 100,
                            'filters' : { 'buyerID' : buyerID }
                        };
                        queue.push(OrderCloudSDK.LineItems.List(direction, orderID, filter));
                    }
                }
                $q.all(queue)
                    .then(function (results) {
                        angular.forEach(results, function (result) {
                            li.Items = [].concat(li.Items, result.Items);
                            li.Meta = result.Meta;
                        });
                        dfd.resolve(li.Items);
                    });
            });
        return dfd.promise;
    }
}

function LineItemModalController($uibModalInstance) {
    var vm = this;
    vm.address = {};

    vm.submit = function () {
        $uibModalInstance.close(vm.address);
    };

    vm.cancel = function () {
        vm.address = {};
        $uibModalInstance.dismiss('cancel');
    };
}
