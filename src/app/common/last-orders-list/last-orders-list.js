angular.module('orderCloud')
	.factory('BackToListService', BackToList);

function BackToList($state) {
	var goHere = {
		destination: 'home',
		filters: null
	};

	function _goToLocation() {
		$state.go(goHere.destination, {filters:goHere.filters},{reload:true});
	}

	function _getLocation() {
		return goHere;
	}

	function _generateLocation(f, fP) {
		if (f.parent == 'ordersMain') {
			goHere = {
				destination: f.name,
				filters: fP.filters
			};
		}
	}

	var svc = {
		GenerateLocation:_generateLocation,
		GetLocation: _getLocation,
		GoToLocation: _goToLocation
	};
	return svc;
}