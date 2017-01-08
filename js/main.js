var map,
  markers = [],
  wikiUrl = "https://en.wikipedia.org/w/api.php?action=opensearch" +
                "&format=json&callback=wikiCallback&search=",
  initLocation = [
    {
      title: 'Canton Tower', 
      location: {lat: 23.105469, lng: 113.325406}
    },
    {
      title: 'Chimelong Paradise', 
      location: {lat: 23.004261, lng: 113.327850}
    },
    {
      title: 'Baiyun Mountain', 
      location: {lat: 23.173641, lng: 113.290724}
    },
    {
      title: 'Shamian Island', 
      location: {lat: 23.1078161, lng: 113.2444451}
    },
    {
      title: 'Xiguan', 
      location: {lat: 23.1205921, lng: 113.2363978}
    },
    {
      title: 'Guangdong Museum', 
      location: {lat: 23.1147656, lng: 113.3241237}
    }];

/** init map and binding ViewModel */
function initMap() {
  map = new google.maps.Map(document.getElementById("map"));
  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);
}
/**
 * create markers in map
 * @constructor
 * @param {array} locations - the array of locations after filter search
 */
function CreateMarker(locations) {
  var bounds = new google.maps.LatLngBounds();
  //info
  var infoWindow = new google.maps.InfoWindow();
  for(var i = 0; i < locations.length; i++) {
    var location = locations[i].location;
    var title = locations[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position: location,
      title: title,
      animation: google.maps.Animation.DROP,
      id: i
    });
    marker.addListener('click', function() {
      var self = this;
      self.setAnimation(google.maps.Animation.DROP);
      getPlaceDetail(self, infoWindow);
      map.setZoom(15);
      map.setCenter(self.getPosition());
    });
    markers.push(marker);
    //add marker as a property of the location
    //then we can trigger marker listener in view model.
    locations[i].marker = marker;
    bounds.extend(new google.maps.LatLng(location.lat, location.lng));
  }
  map.fitBounds(bounds);
  /**
   * get places detail from wiki and show it in infowindow 
   * @param  {Marker} marker - instance of Marker
   * @param  {Infowindow} instance of Infowindow
   */
  function getPlaceDetail(marker, infoWindow) {
    var wikiUrlPlace = wikiUrl + marker.title;
    var placeDetail = "";
    var wikiRequestTimeout = setTimeout(function(){
        placeDetail = "error connection"
        infoWindow.setContent(placeDetail);
        infoWindow.open(map, marker);
    },8000);
    $.ajax({
        url: wikiUrlPlace,
        dataType: "jsonp", 
        success: function(response) {
          if (response.error != undefined) {
            placeDetail = "sorry,there is an error";
          }else if (response[1] == undefined) {
            placeDetail = "no information of this place in wiki";
          }else {
            placeDetail = "<article><header><h3>" + response[1][0] +
                        "</h3></header><p>" + response[2][0] + 
                        "</p><footer><a href='" + response[3][0] + 
                        "' target='_blank'>check in wiki</a></footer>";
          }
          clearTimeout(wikiRequestTimeout);         
          infoWindow.setContent(placeDetail);
          infoWindow.open(map, marker);
        }
    });

  }
}
/**
 * here is the main part when we use Knockoutjs
 */
var ViewModel = function() {
  var self = this;

  //toggle nav
  self.isOpen = ko.observable(false);
  self.toggleNav = function() {
    //self.search.classList.toggle("open");
    self.isOpen(!self.isOpen());
  };

  //init Location
  self.locationArray = ko.observableArray();
  initLocation.forEach(function(data){
     self.locationArray.push(data);
  });
  //show location in nav and show the filter locations' markers
  self.inputValue = ko.observable("");
  self.locationFilterResult = ko.computed(function(){
    //get input value to filter location
    var filter = self.inputValue().toLowerCase();
    if (!filter) {
      markers.forEach(function(marker){
        marker.setVisible(true);
      });
      return self.locationArray();
    }else {
      return ko.utils.arrayFilter(self.locationArray(), function(item,index){
        //if input value if part of the locations
        //show them on the list and set their maker visible
        var locationFit = item.title.toLowerCase().indexOf(filter) > -1;
        markers[index].setVisible(locationFit);
        return locationFit;
      });
    }
  });
  self.createMarker = ko.observable(new CreateMarker(self.locationFilterResult()));

  //when click the lociton in nav,trigger it's marker listner to show infowidow
  self.clickLocationItem = function(location) {
    google.maps.event.trigger(location.marker,'click');
  }
};
/** show error message when fail to load google map */
function googleError() {
  $("#map-error").html("Google map is unabled to work.Maybe you need a VPN");
}
