angular.module('orderCloud')
	.config(ProductSearchConfig)
	.controller('ProductSearchCtrl', ProductSearchController)
	.controller('SerialCtrl', SerialController)
	.controller( 'SerialResultsCtrl', SerialResultsController )
	.controller( 'SerialDetailCtrl', SerialDetailController )
	.controller( 'PartCtrl', PartController )
	.controller( 'PartResultsCtrl', PartResultsController )
	.controller( 'TagCtrl', TagController)
	.controller( 'TagResultsCtrl', TagResultsController )
	.controller( 'TagDetailCtrl', TagDetailController )
	.controller( 'NoResultCtrl', NoResultsController )
;

function ProductSearchConfig($stateProvider, $sceDelegateProvider) {
	$sceDelegateProvider.resourceUrlWhitelist([
		'self',
		'https://www.global.weir/brands/**'
	]);
	$stateProvider
		.state('productSearch', {
			parent: 'base',
			url: '/productSearch',
			templateUrl: 'productSearch/templates/productSearch.tpl.html',
			controller: 'ProductSearchCtrl',
			controllerAs: 'productSearch',
			resolve: {
				CurrentCustomer: function(CurrentOrder) {
					return CurrentOrder.GetCurrentCustomer();
				},
				SerialNumbers: function(WeirService, OrderCloud, CurrentCustomer) {
					if (CurrentCustomer) {
						//return OrderCloud.Me.ListCategories(null, 1, 100, null, null, { "catalogID": cust.id});
						return OrderCloud.Categories.List(null, 1, 100, null, null, {"ParentID": CurrentCustomer.id}, 2, CurrentCustomer.id.substring(0,5))
					} else {
						return { Items: []};
					}
				},
				PartNumbers: function(OrderCloud) {
					//return OrderCloud.Me.ListProducts(null, 1, 100, null, null, null);
					return OrderCloud.Products.List(null, 1, 100, null, null, null);
				},
				MyOrg: function(OrderCloud) {
					return OrderCloud.Buyers.Get(OrderCloud.BuyerID.Get());
				}
			}
		})
		.state( 'productSearch.serial', {
			url: '/serial',
			templateUrl: 'productSearch/templates/productSearch.serial.tpl.html',
			controller: 'SerialCtrl',
			controllerAs: 'serial'
		})
		.state( 'productSearch.serial.results', {
			url: '/search?numbers',
			templateUrl: 'productSearch/templates/productSearch.serial.results.tpl.html',
			controller: 'SerialResultsCtrl',
			controllerAs: 'serialResults',
			resolve: {
				SerialNumberResults: function( $stateParams, WeirService ) {
					return WeirService.SerialNumbers($stateParams.numbers.split(','));
				}
			}
		})
		.state( 'productSearch.serial.detail', {
			url: '/:number?:searchNumbers',
			templateUrl: 'productSearch/templates/productSearch.serial.detail.tpl.html',
			controller: 'SerialDetailCtrl',
			controllerAs: 'serialDetail',
			resolve: {
				SerialNumberDetail: function( $stateParams, WeirService ) {
					return WeirService.SerialNumber($stateParams.number);
				}
			}
		})
		.state( 'productSearch.part', {
			url: '/part',
			templateUrl: 'productSearch/templates/productSearch.part.tpl.html',
			controller: 'PartCtrl',
			controllerAs: 'part'
		})
		.state( 'productSearch.part.results', {
			url: '/search?numbers',
			templateUrl: 'productSearch/templates/productSearch.part.results.tpl.html',
			controller: 'PartResultsCtrl',
			controllerAs: 'partResults',
			resolve: {
				PartNumberResults: function( $stateParams, WeirService) {
					return WeirService.PartNumbers($stateParams.numbers.split(','));
				}
			}
		})
		.state( 'productSearch.tag', {
			url: '/tag',
			templateUrl: 'productSearch/templates/productSearch.tag.tpl.html',
			controller: 'TagCtrl',
			controllerAs: 'tag'
		})
		.state( 'productSearch.tag.results', {
			url: '/search?numbers',
			templateUrl: 'productSearch/templates/productSearch.tag.results.tpl.html',
			controller: 'TagResultsCtrl',
			controllerAs: 'tagResults',
			resolve: {
				TagNumberResults: function( $stateParams, WeirService ) {
					return WeirService.TagNumbers($stateParams.numbers.split(','));
				}
			}
		})
		.state( 'productSearch.tag.detail', {
			url: '/:number?:searchNumbers',
			templateUrl: 'productSearch/templates/productSearch.tag.detail.tpl.html',
			controller: 'TagDetailCtrl',
			controllerAs: 'tagDetail',
			resolve: {
				TagNumberDetail: function( $stateParams, WeirService ) {
					return WeirService.TagNumber($stateParams.number);
				}
			}
		})
		.state( 'productSearch.noresults', {
			url: '/noresults',
			templateUrl: 'productSearch/templates/productSearch.noresults.tpl.html',
			controller: 'NoResultCtrl',
			controllerAs: 'noResult'
		})

	;
}

function ProductSearchController($sce, $state, $rootScope, OrderCloud, CurrentOrder, WeirService, CurrentCustomer, SerialNumbers, PartNumbers, MyOrg, imageRoot) {
	var vm = this;
	vm.serialNumberList = SerialNumbers.Items;
	vm.partNumberList = PartNumbers.Items;
	vm.searchType = WeirService.GetLastSearchType();
	vm.IsServiceOrg = (MyOrg.xp.Type.id == 2);
	vm.Customer = CurrentCustomer;
	vm.AvailableCustomers = MyOrg.xp.Customers;
	vm.ImageBaseUrl = imageRoot;
	vm.GetValveImageUrl = function (img) {
	    return vm.ImageBaseUrl + "Valves/" + img;
	};


	if (!vm.IsServiceOrg) {
		if (!vm.Customer || vm.Customer.id != MyOrg.ID) {
			vm.Customer = {id: MyOrg.ID, name: MyOrg.Name};
			CurrentOrder.SetCurrentCustomer(vm.Customer)
				.then(function() {
					CurrentOrder.Get();
				})
				.catch(function() {
					WeirService.FindCart(vm.Customer);
				});
		}
	}

	vm.selfsearch = false;
	vm.SelectingCustomer = vm.IsServiceOrg && !vm.Customer;
	vm.customerFilter = null;
	vm.SelectCustomer = function() {
		if (vm.Customer.id == MyOrg.ID) {
			vm.customerFilter = "";
			vm.selfsearch = true;
		} else {
			vm.customerFilter = vm.Customer.name;
			vm.selfsearch = false;
		}
		vm.SelectingCustomer = true;
	};

	vm.ClearFilter = function() {
		vm.customerFilter = null; $rootScope.$broadcast('OC:RemoveOrder', null, null);
		CurrentOrder.Remove();
	};

	vm.CustomerSelected = function() {
		var newCust = null;
		if (vm.selfsearch) {
			newCust = {id: MyOrg.ID, name: MyOrg.Name};
		} else {
			for(var i=0; i<vm.AvailableCustomers.length; i++) {
				if (vm.AvailableCustomers[i].name == vm.customerFilter) {
					newCust = vm.AvailableCustomers[i];
					break;
				}
			}
		}
		if (newCust && (!vm.Customer || newCust.id != vm.Customer.id)) {
			vm.Customer = newCust;
			CurrentOrder.SetCurrentCustomer(vm.Customer)
				.then(function() {
					vm.serialNumberList.length = 0;
					WeirService.FindCart(vm.Customer)
						.then(function() {
                            OrderCloud.Categories.List(null, 1, 100, null, null, { "catalogID": vm.Customer.xp.WeirGroup.label, "ParentID" : vm.Customer.id})
								.then(function(results) {
									vm.serialNumberList.push.apply(vm.serialNumberList, results.Items);
								});
						});
				});
		}
		vm.SelectingCustomer = vm.IsServiceOrg && !vm.Customer;
		$rootScope.$broadcast('OC:RemoveOrder');
	};

	vm.formatSerialNumber = function(number) {
		if (!number) return;
		return number.substr(0,3) + '-' + number.substr(3,3) + '/' + number.substr(6,4);
	};
	var labels = {
		en: {
			SerialSearch: "Search by serial number",
			PartSearch: "Search by part number",
			TagSearch: "Search by Tag number",
			CustomerFilter: "Results filtered by; ",
			SelectCustomer: "Reset search filter",
			SearchMine: "Search your products",
			SearchOr: "Or",
			FilterEndUser: "Filter by end-user",
			Select: "Select"
		},
		fr: {
			SerialSearch: $sce.trustAsHtml("Recherche par num&eacute;ro de s&eacute;rie"),
			PartSearch: $sce.trustAsHtml("Recherche par num&eacute;ro de pi&eacute;ce"),
			TagSearch: $sce.trustAsHtml("Recherche par num&eacute;ro de tag"),
			CustomerFilter: $sce.trustAsHtml("FR: Results filtered by; "),
			SelectCustomer: $sce.trustAsHtml("FR: Reset search filter"),
			SearchMine: $sce.trustAsHtml("FR: Search your products"),
			SearchOr: $sce.trustAsHtml("FR: Or"),
			FilterEndUser: $sce.trustAsHtml("FR: Filter by end-user"),
			Select: $sce.trustAsHtml("FR: Select")
		}
	};
	vm.labels = WeirService.LocaleResources(labels);
	var searchType = WeirService.GetLastSearchType();
	searchType = searchType || WeirService.SearchType.Serial;
	if($state.current.name == 'productSearch.noresults') $state.go('productSearch.noresults');
	else if (searchType == WeirService.SearchType.Part) {
		$state.go('productSearch.part');
	} else if (searchType == WeirService.SearchType.Tag) {
		$state.go('productSearch.tag');
	} else if (searchType == WeirService.SearchType.Serial){
		$state.go('productSearch.serial');
	}

}

function SerialController(WeirService, $scope, $q, OrderCloud, $state, $sce, toastr ) {
	var vm = this;

	var labels = {
		en: {
			WhereToFind: "where to find your serial number",
			EnterSerial: "Enter Serial Number",
			AddMore: "Add More Serial Numbers   +",
			ClearSearch: "Clear Search",
			Search: "Search"
		},
		fr: {
			WhereToFind: $sce.trustAsHtml("O&ugrave; trouver votre num&eacute;ro de s&eacute;rie"),
			EnterSerial: $sce.trustAsHtml("Entrer le num&eacute;ro de s&eacute;rie"),
			AddMore: $sce.trustAsHtml("Ajouter des num&eacute;ros plus s&eacute;rie   +"),
			ClearSearch: $sce.trustAsHtml("Effacer la recherche"),
			Search: "Chercher"
		}
	};
	vm.labels = WeirService.LocaleResources(labels);
	WeirService.SetLastSearchType(WeirService.SearchType.Serial);

	vm.serialNumbers = [null];

	vm.addSerialNumber = function() {
		vm.serialNumbers.push(null);
	};

	vm.removeSerialNumber = function(index) {
		vm.serialNumbers.splice(index, 1);
	};

	vm.searchSerialNumbers = function() {
		if(!vm.serialNumbers[0] || vm.serialNumbers.length == 0) {
			toastr.info("Please enter an item in the search box.", "Empty Search");
		} else if (vm.serialNumbers.length == 1) {
			$state.go('productSearch.serial.detail', {number: vm.serialNumbers[0], searchNumbers:  vm.serialNumbers[0]});
		} else {
			$state.go('productSearch.serial.results', {numbers: vm.serialNumbers.join(',')});
		}
	};

	vm.clearSearch = function() {
		vm.serialNumbers = [null];
	};

	vm.showClearSearch = function() {
		var count = 0;
		angular.forEach(vm.serialNumbers, function(number) {
			if (number) count++;
		});
		return count > 0;
	};
	vm.goToArticle = function(article) {
		$state.go('news', {id: article.ID});
	};
    vm.updateSerialList = function(input) {
        var deferred = $q.defer();
        if (input.length >= 3) {
        	// Why do we do this?
            WeirService.SerialNumber(input)
	            .then(function(data) {
                    $scope.productSearch.serialNumberList = (data && data.Items) ? data.Items : [];
                    deferred.resolve();
                    return;
                })
                .catch(function(ex) {
                    deferred.resolve("No Tags with this id");
                    return;
                });
        }

        else return;
    };
}

function SerialResultsController(WeirService, $stateParams, $state, SerialNumberResults, $sce ) {
	var vm = this;
	vm.serialNumberResults = SerialNumberResults;
	vm.searchNumbers = $stateParams.numbers;

	var multiCust = false;
	var cust = "";
	var numFound = 0;
	for(var i=0; i< SerialNumberResults.length; i++) {
		var tmp = SerialNumberResults[i].Detail;
		if (tmp) {
			numFound++;
			if (cust == "" || (tmp.xp.Customer && tmp.xp.Customer != cust)) {
				if (cust != "") {
					multiCust = true;
				} else {
					cust = tmp.xp.Customer;
				}
			}
		}
	}
	vm.MultipleCustomers = multiCust;
	vm.Customer = cust;

	var labels = {
		en: {
			Customer: "Customer",
			ResultsHeader: "Showing results for serial numbers; " + numFound.toString() + " of " + SerialNumberResults.length.toString() + " searched serial numbers found",
			SerialNumber: "Serial Number",
			TagNumber: "Tag number (if available)",
			ValveDesc: "Valve description",
			NoResultsMsg: "No results found for;",
			SearchAgain: "Search again",
			ViewDetails: "View details"
		},
		fr: {
			Customer: "Client",
			ResultsHeader: $sce.trustAsHtml("Affichage des r&eacute;sultats pour les num&eacute;ros de &eacute;rie; " + numFound.toString() + " of " + SerialNumberResults.length.toString() + " searched serial numbers found"),
			SerialNumber: $sce.trustAsHtml("Num&eacute;ro de s&eacute;rie"),
			TagNumber: $sce.trustAsHtml("Num&eacute;ro de tag (si disponible)"),
			ValveDesc: "Description de soupape",
			NoResultsMsg: $sce.trustAsHtml("Aucun r&eacute;sultat pour;"),
			SearchAgain: $sce.trustAsHtml("Chercher &agrave; nouveau"),
			ViewDetails: $sce.trustAsHtml("Voir les d&eacute;tails")
		}
	};
	if(numFound == 0) $state.go('productSearch.noresults');
	vm.labels = WeirService.LocaleResources(labels);
}

function SerialDetailController( $stateParams, $rootScope, $state, $sce, WeirService, SerialNumberDetail ) {
	var vm = this;
	vm.serialNumber = SerialNumberDetail;
	vm.searchNumbers = $stateParams.searchNumbers;
	vm.PartQuantity = function(partId) {
		return SerialNumberDetail.xp.Parts[partId];
	};
	if(typeof vm.serialNumber != 'object') {
		$state.go('productSearch.noresults', {}, {reload:true});
	}
	var labels = {
		en: {
			ResultsHeader: "Showing results for serial number; ",
			Tag: "Tag number (if available); ",
			Customer: "Customer; ",
			ManufDate: "Date of valve manufacture; ",
			SearchAgain: "Search Again",
			BackToResults: "Return to Results",
			SpecHeader: "Specification",
			SerialNum: "Serial number",
			ValveDesc: "Valve description",
			ValveQty: "Valve quantity",
			Size: "Size",
			ValveType: "Valve type",
			ValveForm: "Valve form",
			BodyRating: "Body rating",
			Pressure: "Pressure",
			BackPressure: "Back Pressure",
			Temp: "Temperature",
			Inlet: "In",
			Outlet: "Out"
		},
		fr: {
			ResultsHeader: $sce.trustAsHtml("Affichage des r&eacute;sultats pour le num&eacute;ro de s&eacute;rie; "),
			Tag: $sce.trustAsHtml("Num&eacute;ro d'identification (si disponible); "),
			Customer: $sce.trustAsHtml("Client; "),
			ManufDate: $sce.trustAsHtml("La date de fabrication de la valve; "),
			SearchAgain: $sce.trustAsHtml("Chercher &agrave; nouveau"),
			BackToResults: $sce.trustAsHtml("Retour aux r&eacute;sultats"),
			SpecHeader: $sce.trustAsHtml("Sp&eacute;cification"),
			SerialNum: $sce.trustAsHtml("Num&eacute;ro de s&eacute;rie"),
			ValveDesc: $sce.trustAsHtml("Description de la vanne"),
			ValveQty: $sce.trustAsHtml("La quantit&eacute; de vanne"),
			Size: $sce.trustAsHtml("Taille"),
			ValveType: $sce.trustAsHtml("Type de vanne"),
			ValveForm: $sce.trustAsHtml("Sous forme de Valve"),
			BodyRating: $sce.trustAsHtml("Note du corps"),
			Pressure: $sce.trustAsHtml("Pression"),
			BackPressure: $sce.trustAsHtml("Retour Pression"),
			Temp: $sce.trustAsHtml("Temp&eacute;rature"),
			Inlet: $sce.trustAsHtml("Dans"),
			Outlet: $sce.trustAsHtml("En dehors")
		}
	};
	var headers = {
		en: {
			PartList: "Parts list for serial number;",
			PartNum: "Part number",
			PartDesc: "Description of part",
			PartQty: "Part quantity",
			ReplSched: "Recommended replacement",
			LeadTime: "Lead time",
			Price: "Price per item or set",
			Qty: "Quantity",
			LeadTimeNotice: "Lead time for all orders will be based on the longest lead time from the list of spares requested",
			AddToQuote: "Add to Quote"
		},
		fr: {
			PartList: $sce.trustAsHtml("Liste des pi&eacute;ces pour le num&eacute;ro de s&eacute;rie;"),
			PartNum: $sce.trustAsHtml("R&eacute;f&eacute;rence"),
			PartDesc: $sce.trustAsHtml("Description de la partie"),
			PartQty: $sce.trustAsHtml("Quantit&eacute; de partie"),
			ReplSched: $sce.trustAsHtml("Remplacement recommand&eacute;e"),
			LeadTime: $sce.trustAsHtml("D&eacute;lai de mise en &oelig;uvre"),
			Price: $sce.trustAsHtml("Prix par article ou ensemble"),
			Qty: $sce.trustAsHtml("Quantit&eacute;"),
			LeadTimeNotice: $sce.trustAsHtml("D&eacute;lai de livraison pour toutes les commandes sera bas&eacute; sur le plus long d&eacute;lai de la liste des pi&eacute;ces de rechange demand&eacute;es"),
			AddToQuote: $sce.trustAsHtml("Ajouter &agrave; la proposition")
		}
	};
	vm.labels = WeirService.LocaleResources(labels);
	vm.headers = WeirService.LocaleResources(headers);

	vm.addPartToQuote = function(part) {
		part.xp = typeof part.xp == "undefined" ? {} : part.xp;
		part.xp.SN = vm.serialNumber.Name;
		part.xp.TagNumber = vm.serialNumber.xp.TagNumber;
		WeirService.AddPartToQuote(part)
			.then(function(data) {
				$rootScope.$broadcast('LineItemAddedToCart', data.Order.ID, data.LineItem); //This kicks off an event in cart.js
				part.Quantity = null;
			});
	};
}

function TagController(WeirService,$scope, $q, $state, $sce, toastr) {
	var vm = this;

	var labels = {
		en: {
			// WhereToFind: "where to find your serial number",
			EnterTag: "Enter Tag number",
			AddMore: "Add more tag numbers   +",
			ClearSearch: "Clear Search",
			Search: "Search"
		},
		fr: {
			// WhereToFind: $sce.trustAsHtml("O&ugrave; trouver votre num&eacute;ro de s&eacute;rie"),
			EnterTag: $sce.trustAsHtml("FR: Enter Tag number"),
			AddMore: $sce.trustAsHtml("FR: Add more tag numbers   +"),
			ClearSearch: $sce.trustAsHtml("Effacer la recherche"),
			Search: "Chercher"
		}
	};
	vm.labels = WeirService.LocaleResources(labels);
	WeirService.SetLastSearchType(WeirService.SearchType.Tag);

	vm.tags = [null];

	vm.addTag = function() {
		vm.tags.push(null);
	};

	vm.removeTag = function(index) {
		vm.tags.splice(index, 1);
	};

	vm.searchTags = function() {
		if(!vm.tags[0] || vm.tags.length == 0) {
			toastr.info("Please enter an item in the search box.", "Empty Search");
		} else if (vm.tags.length == 1) {
			$state.go('productSearch.tag.detail', {number: vm.tags[0], searchNumbers: vm.tags[0]});
		}
		else {
			$state.go('productSearch.tag.results', {numbers: vm.tags.join(',')});
		}
	};

	vm.clearSearch = function() {
		vm.tags = [null];
	};

	vm.showClearSearch = function() {
		var count = 0;
		angular.forEach(vm.tags, function(number) {
			if (number) count++;
		});
		return count > 0;
	};
	vm.updateTagList = function(input) {
		if (input.length >= 3) {
			var deferred = $q.defer();
			WeirService.TagNumber(input)
				.then(function (data) {
					$scope.productSearch.serialNumberList = (data.Items) ? data.Items : [];
					deferred.resolve();
					return;
				})
				.catch(function(ex) {
					deferred.resolve();
					return;
				});
		}
	};

}

function TagResultsController(WeirService, $stateParams, $state, TagNumberResults, $sce ) {
	var vm = this;
	vm.tagNumberResults = TagNumberResults;
	vm.searchNumbers = $stateParams.numbers;
	var multiCust = false;
	var cust = "";
	var numFound = 0;
	for(var i=0; i< TagNumberResults.length; i++) {
		var tmp = TagNumberResults[i].Detail;
		if (tmp) {
			numFound++;
			if (cust == "" || (tmp.xp.Customer && tmp.xp.Customer != cust)) {
				if (cust != "") {
					multiCust = true;
				} else {
					cust = tmp.xp.Customer;
				}
			}
		}
	}
	vm.MultipleCustomers = multiCust;
	vm.Customer = cust;

	var labels = {
		en: {
			Customer: "Customer",
			ResultsHeader: "Showing results for tag numbers; " + numFound.toString() + " of " + TagNumberResults.length.toString() + " searched tag numbers found",
			SerialNumber: "Serial Number",
			TagNumber: "Tag number (if available)",
			ValveDesc: "Valve description",
			NoResultsMsg: "No results found for;",
			SearchAgain: "Search again",
			ViewDetails: "View details"
		},
		fr: {
			Customer: "Client",
			ResultsHeader: $sce.trustAsHtml("FR: Showing results for tag numbers; " + numFound.toString() + " of " + TagNumberResults.length.toString() + " searched tag numbers found"),
			SerialNumber: $sce.trustAsHtml("Num&eacute;ro de s&eacute;rie"),
			TagNumber: $sce.trustAsHtml("Num&eacute;ro de tag (si disponible)"),
			ValveDesc: "Description de soupape",
			NoResultsMsg: $sce.trustAsHtml("Aucun r&eacute;sultat pour;"),
			SearchAgain: $sce.trustAsHtml("Chercher &agrave; nouveau"),
			ViewDetails: $sce.trustAsHtml("Voir les d&eacute;tails")
		}
	};
	if(numFound == 0) $state.go('productSearch.noresults');
	vm.labels = WeirService.LocaleResources(labels);
}

function TagDetailController( $stateParams, $rootScope, $sce, $state, WeirService, TagNumberDetail ) {
	var vm = this;
	vm.tagNumber = TagNumberDetail;
	vm.searchNumbers = $stateParams.searchNumbers;
	if(typeof vm.tagNumber != 'object') {
		$state.go('productSearch.noresults', {}, {reload:true});
	}
	vm.PartQuantity = function(partId) {
		return TagNumberDetail.xp.Parts[partId];
	};
	var labels = {
		en: {
			ResultsHeader: "Showing results for tag number; ",
			Tag: "Tag number (if available); ",
			Customer: "Customer; ",
			ManufDate: "Date of valve manufacture; ",
			SearchAgain: "Search Again",
			BackToResults: "Return to Results",
			SpecHeader: "Specification",
			SerialNum: "Serial number",
			ValveDesc: "Valve description",
			ValveQty: "Valve quantity",
			Size: "Size",
			ValveType: "Valve type",
			ValveForm: "Valve form",
			BodyRating: "Body rating",
			Pressure: "Pressure",
			BackPressure: "Back Pressure",
			Temp: "Temperature",
			Inlet: "In",
			Outlet: "Out"
		},
		fr: {
			ResultsHeader: $sce.trustAsHtml("FR: Showing results for tag number "),
			Tag: $sce.trustAsHtml("Num&eacute;ro d'identification (si disponible); "),
			Customer: $sce.trustAsHtml("Client; "),
			ManufDate: $sce.trustAsHtml("La date de fabrication de la valve; "),
			SearchAgain: $sce.trustAsHtml("Chercher &agrave; nouveau"),
			BackToResults: $sce.trustAsHtml("Retour aux r&eacute;sultats"),
			SpecHeader: $sce.trustAsHtml("Sp&eacute;cification"),
			SerialNum: $sce.trustAsHtml("Num&eacute;ro de s&eacute;rie"),
			ValveDesc: $sce.trustAsHtml("Description de la vanne"),
			ValveQty: $sce.trustAsHtml("La quantit&eacute; de vanne"),
			Size: $sce.trustAsHtml("Taille"),
			ValveType: $sce.trustAsHtml("Type de vanne"),
			ValveForm: $sce.trustAsHtml("Sous forme de Valve"),
			BodyRating: $sce.trustAsHtml("Note du corps"),
			Pressure: $sce.trustAsHtml("Pression"),
			BackPressure: $sce.trustAsHtml("Retour Pression"),
			Temp: $sce.trustAsHtml("Temp&eacute;rature"),
			Inlet: $sce.trustAsHtml("Dans"),
			Outlet: $sce.trustAsHtml("En dehors")
		}
	};
	var headers = {
		en: {
			PartList: "Parts list for tag number;",
			PartNum: "Part number",
			PartDesc: "Description of part",
			PartQty: "Part quantity",
			ReplSched: "Recommended replacement",
			LeadTime: "Lead time",
			Price: "Price per item or set",
			Qty: "Quantity",
			LeadTimeNotice: "Lead time for all orders will be based on the longest lead time from the list of spares requested",
			AddToQuote: "Add to Quote"
		},
		fr: {
			PartList: $sce.trustAsHtml("FR: Parts list for tag number"),
			PartNum: $sce.trustAsHtml("R&eacute;f&eacute;rence"),
			PartDesc: $sce.trustAsHtml("Description de la partie"),
			PartQty: $sce.trustAsHtml("Quantit&eacute; de partie"),
			ReplSched: $sce.trustAsHtml("Remplacement recommand&eacute;e"),
			LeadTime: $sce.trustAsHtml("D&eacute;lai de mise en &oelig;uvre"),
			Price: $sce.trustAsHtml("Prix par article ou ensemble"),
			Qty: $sce.trustAsHtml("Quantit&eacute;"),
			LeadTimeNotice: $sce.trustAsHtml("D&eacute;lai de livraison pour toutes les commandes sera bas&eacute; sur le plus long d&eacute;lai de la liste des pi&eacute;ces de rechange demand&eacute;es"),
			AddToQuote: $sce.trustAsHtml("Ajouter &agrave; la proposition")
		}
	};
	vm.labels = WeirService.LocaleResources(labels);
	vm.headers = WeirService.LocaleResources(headers);

	vm.addPartToQuote = function(part) {
		part.xp = typeof part.xp == "undefined" ? {} : part.xp;
		part.xp.SN = vm.tagNumber.Name;
		part.xp.TagNumber = vm.tagNumber.xp.TagNumber;
		WeirService.AddPartToQuote(part)
			.then(function(data) {
				$rootScope.$broadcast('LineItemAddedToCart', data.Order.ID, data.LineItem); //This kicks off an event in cart.js
				part.Quantity = null;
			});
	};
}

function PartController( $state, $sce, $scope, $q, OrderCloud, WeirService ) {
	var vm = this;
	vm.PartMatches = [];
	vm.partNumbers = [null];
	WeirService.SetLastSearchType(WeirService.SearchType.Part);

	vm.addPartNumber = function() {
		vm.partNumbers.push(null);
	};

	vm.removePartNumber = function(index) {
		vm.partNumbers.splice(index, 1);
	};

	vm.searchPartNumbers = function() {
		$state.go('productSearch.part.results', {numbers: vm.partNumbers.join(',')});
	};

	vm.clearSearch = function() {
		vm.partNumbers = [null];
	};

	vm.showClearSearch = function() {
		var count = 0;
		angular.forEach(vm.partNumbers, function(number) {
			if (number) count++;
		});
		return count > 0;
	};

	var labels = {
		en: {
			WhereToFind: "where to find your part number",
			EnterPart: "Enter part number",
			EnterParts: "Enter part numbers",
			AddMore: "Add more part numbers   ",
			ClearSearch: "Clear search",
			Search: "Search"
		},
		fr: {
			WhereToFind: $sce.trustAsHtml("O&ugrave; trouver votre num&eacute;ro de pi&eacute;ce"),
			EnterPart: $sce.trustAsHtml("Entrez le num$eacute;ro de la pi&eacute;ce"),
			EnterParts: $sce.trustAsHtml("Entrez le num$eacute;ro de la pi&eacute;ce"),
			AddMore: $sce.trustAsHtml("Ajouter plus de num&eacute;ros de pi&eacute;ce   "),

			ClearSearch: $sce.trustAsHtml("Effacer la recherche"),
			Search: "Chercher"
		}
	};
	vm.labels = WeirService.LocaleResources(labels);

    vm.updatePartList = function(input) {
	    if (input.length >= 3) {
		    var results = [];
		    // search, page, pageSize, searchOn, sortBy, filters, categoryID, catalogID
		    OrderCloud.Me.ListProducts(vm.WeirGroup, 1, 20, "ID", "Name", { "Name": input + "*" }, null, null)
			    .then(function (newList) {
				    results = newList.Items;
			    })
			    .then(function () {
				    if (vm.WeirGroup == 'WVCUK') {
					    OrderCloud.Me.ListProducts(vm.WeirGroup, 1, 20, "ID", "Name", { "xp.AlternatePartNumber": input + "*" }, null, null)
						    .then(function (newList) {
							    results.push.apply(results, newList.Items);
							    vm.PartMatches.length = 0;
							    vm.PartMatches.push.apply(vm.PartMatches, results);
						    });
				    } else {
					    vm.PartMatches.length = 0;
					    vm.PartMatches.push.apply(vm.PartMatches, results);
				    }
			    })
			    .catch(function (ex) {
			    });
	    }
    };
}

function PartResultsController( $rootScope, $sce, $state, WeirService, PartNumberResults ) {
	var vm = this;
	vm.partNumberResults = PartNumberResults;
	if (!vm.partNumberResults || !vm.partNumberResults.Parts || vm.partNumberResults.Parts.length == 0) $state.go('productSearch.noresults');
	vm.Customer = PartNumberResults.Customer;
	vm.MultipleCustomers = (vm.Customer == "*");
	var numFound = 0;
	angular.forEach(PartNumberResults.Parts, function(entry) {
		if (entry.Detail) numFound++;
	});

	var labels = {
		en: {
			Customer: "Customer",
			ResultsHeader: "Showing results for part numbers; " + numFound.toString() + " of " + PartNumberResults.Parts.length.toString() + " searched part numbers found",
			SearchAgain: "Search again",
			PartNum: "Part number",
			PartDesc: "Description of part",
			ReplSched: "Recommended replacement",
			LeadTime: "Lead time",
			Price: "Price per item or set",
			Qty: "Quantity",
			LeadTimeNotice: "Lead time for all orders will be based on the longest lead time from the list of spares requested",
			AddToQuote: "Add to Quote"
		},
		fr: {
			Customer: "Client",
			ResultsHeader: $sce.trustAsHtml("Affichage des r&eacute;sultats pour les num&eacute;ros de pi&eacute;ce " + numFound.toString() + " of " + PartNumberResults.Parts.length.toString() + " searched part numbers found"),
			SearchAgain: $sce.trustAsHtml("Chercher &agrave; nouveau"),
			PartNum: $sce.trustAsHtml("R&eacute;f&eacute;rence"),
			PartDesc: $sce.trustAsHtml("Description de la partie"),
			PartQty: $sce.trustAsHtml("Quantit&eacute; de partie"),
			ReplSched: $sce.trustAsHtml("Remplacement recommand&eacute;e"),
			LeadTime: $sce.trustAsHtml("D&eacute;lai de mise en &oelig;uvre"),
			Price: $sce.trustAsHtml("Prix par article ou ensemble"),
			Qty: $sce.trustAsHtml("Quantit&eacute;"),
			LeadTimeNotice: $sce.trustAsHtml("D&eacute;lai de livraison pour toutes les commandes sera bas&eacute; sur le plus long d&eacute;lai de la liste des pi&eacute;ces de rechange demand&eacute;es"),
			AddToQuote: $sce.trustAsHtml("Ajouter &agrave; la proposition")

		}
	};
	vm.labels = WeirService.LocaleResources(labels);
	if(numFound == 0) $state.go('productSearch.noresults');
	vm.addPartToQuote = function(part) {
		part.xp = typeof part.xp == "undefined" ? {} : part.xp;
		part.xp.SN = null;
		part.xp.TagNumber = null;
		WeirService.AddPartToQuote(part)
			.then(function(data) {
				$rootScope.$broadcast('LineItemAddedToCart', data.Order.ID, data.LineItem); //This kicks off an event in cart.js
				part.Quantity = null;
			});
	};
}

function NoResultsController($state, WeirService){
	var vm = this;
	vm.submitEnquiry = function(){
		console.log("Functioning.");
	};
	vm.searchAgain = function () {
		var searchType = WeirService.GetLastSearchType();
		searchType = searchType || WeirService.SearchType.Serial;
		if (searchType == WeirService.SearchType.Part) {
			$state.go('productSearch.part');
		} else if (searchType == WeirService.SearchType.Tag) {
			$state.go('productSearch.tag');
		} else {
			$state.go('productSearch.serial');
		}
	};
}