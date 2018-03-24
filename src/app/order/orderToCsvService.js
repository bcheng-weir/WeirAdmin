angular.module('orderCloud')
    .service('OrderToCsvService', OrderToCsvService);

function OrderToCsvService($filter,$sce,OCGeography,Underscore) {
    function ToCsvJson(Order, LineItems, DeliveryAddress, Payments, Labels) {
        var payment = null;
        if (Payments && Payments.length) {
            payment = Payments[0];
        }

        angular.forEach(Labels, function(value, key) {
            var result =  $sce.getTrustedHtml(value);
            if (result !== "[object Object]") {
                result = result.toString().replace(/&eacute;/g, 'é').replace(/&egrave;/g, 'è');
                Labels[key] = result;
            }
        });
        var data = [
            [Labels.status, Order.xp.Status],
            [Labels.WeirOrderNo, Order.ID],
            [Labels.QuoteRef, (Order.xp && Order.xp.RefNum ? Order.xp.RefNum : "")],
            [Labels.PONumber, (payment && payment.xp && payment.xp.PONumber ? payment.xp.PONumber : "")],
            ["", ""],
            [Labels.SerialNum, Labels.TagNum, Labels.PartNum, Labels.Description, Labels.RecReplacement, Labels.LeadTimeAvailability, Labels.Currency, Labels.PricePerItem, Labels.Quantity]
        ];

        //var currency = (Order.FromCompanyID.substr(0,5) == "WVCUK") ? ("£") : ((Order.FromCompanyID.substr(0,5) == "WPIFR") ? ("€") : (""));

        var currencySymbol = function () {
            var currency = (Order.xp.Currency && Order.xp.Currency.ConvertTo) ? Order.xp.Currency.ConvertTo : null;
            if (!currency)
                currency = $filter('weirGroupFromBuyersID')(Order.xp.CustomerID) == 'WPIFR' ? 'EUR' : 'GBP';

            var currency_symbols = {
                'GBP': '£',
                'EUR': '€',
                'USD': '$',
                'AUD': '$',
                'ZAR': 'R'
            };
            return currency_symbols[currency];
        }

        angular.forEach(LineItems, function (item) {
            var line = [];
            line.push(item.xp.SN);
            line.push(item.xp.TagNumber);
            line.push(item.xp.ProductName);
            line.push(item.xp.Description);
            line.push(item.xp.ReplacementSchedule);
            line.push(item.xp.LeadTime);
            line.push(currencySymbol());
            line.push(item.UnitPrice);
            line.push(item.Quantity);
            data.push(line);
        });
        data.push(["","","",Order.xp.ShippingDescription,"","",currencySymbol(),Order.ShippingCost,""]);
        data.push(["", "", "", "", "", Labels.Total, currencySymbol(), Order.Total]);
        data.push(["", ""]);
        data.push([Labels.DeliveryAddress]);
	    if (DeliveryAddress) {
		    if(DeliveryAddress.Country=="GB") {
			    data.push([DeliveryAddress.FirstName + " " + DeliveryAddress.LastName, ""]);
			    data.push([DeliveryAddress.CompanyName]);
			    data.push([DeliveryAddress.Street1]);
                DeliveryAddress.Street2 ? data.push([DeliveryAddress.Street2]) : null;
                DeliveryAddress.xp.Street3 ? data.push([DeliveryAddress.xp.Street3]) : null;
			    data.push([DeliveryAddress.City]);
			    data.push([DeliveryAddress.Zip]);
			    //data.push([country(DeliveryAddress.Country)]);
                data.push([Order.CountryName]);
		    } else if (DeliveryAddress.Country=="FR") {
			    data.push([DeliveryAddress.FirstName + " " + DeliveryAddress.LastName, ""]);
			    data.push([DeliveryAddress.CompanyName]);
			    data.push([DeliveryAddress.Street1]);
                DeliveryAddress.Street2 ? data.push([DeliveryAddress.Street2]) : null;
                DeliveryAddress.xp.Street3 ? data.push([DeliveryAddress.xp.Street3]) : null;
			    data.push([DeliveryAddress.Zip, "", DeliveryAddress.City]);
			    //data.push([country(DeliveryAddress.Country)]);
                data.push([Order.CountryName]);
		    }
	    }

	    data.push(["", ""]);
	    data.push([Labels.Comments]);
	    angular.forEach(Order.xp.CommentsToWeir, function(comment) {
		    data.push(["",comment.by,$filter('weirdate')(comment.date)]);
		    data.push(["","",comment.val]);
	    });

        return data;
    }
    var service = {
        ToCsvJson: ToCsvJson
    };
    return service;
}
