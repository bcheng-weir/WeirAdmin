angular.module('orderCloud')
	.config(OrderConfig)
	.controller('OrderCtrl',OrderController);

function OrderConfig($stateProvider) {
	$stateProvider.state('orders', {
		parent:'base',
		templateUrl:'orders/templates/orders.tpl.html',
		controller:'OrderCtrl',
		controllerAs:'orders',
		url:'/orders',
		data:{componentName:'Orders'},
		resolve: {
			Orders: function() {
				return;
			}
		}
	});
}

function OrderController($sce, Orders) {
	var vm = this;

	var labels = {
		en: {

		},
		fr: {

		}
	};

	vm.labels = labels.en;
}