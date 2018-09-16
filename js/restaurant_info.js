let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {  
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {      
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
        scrollWheelZoom: false
      });
      L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
        mapboxToken: 'pk.eyJ1Ijoia2luZ3NsZXlvIiwiYSI6ImNqa2dvMWQ3bjBsdzUzcmt4NmJqMWcyamQifQ.gosQaTN3byluv6U1i2niIQ',
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
          '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        id: 'mapbox.streets'    
      }).addTo(newMap);
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}  

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.imageAltTagForRestaurant(restaurant);

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */

fillReviewsHTML = () => {
  let reviews;
  let reviews_URL = "http://localhost:1337/reviews";
  fetch(reviews_URL).then((response) =>{
     return response.json();
  }).then((review) =>{
    reviews = review;
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h2');
    title.setAttribute('tabindex', 0);
    title.innerHTML = 'Reviews';
    container.appendChild(title);
   
    if (!reviews) {
      console.log(reviews);
      const noReviews = document.createElement('p');
      noReviews.innerHTML = 'No reviews yet!';
      container.appendChild(noReviews);
      return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
      //This checks each review against restaurants
      if(review.restaurant_id === self.restaurant.id){;
        ul.appendChild(createReviewHTML(review));
      }
    });
    ul.appendChild(addNewReviews(review));
    container.appendChild(ul);
  }).catch((error) => {
 	console.log("Sorry. There's " + error);
  });
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.setAttribute('tabindex', 0);
  const ratingHeading = document.createElement('div');
  ratingHeading.setAttribute("class", "rating-heading");
  const name = document.createElement('p');
  name.setAttribute("class", "reviewer" );
  name.innerHTML = review.name;
  //li.appendChild(name);
  ratingHeading.appendChild(name);
  const rating = document.createElement('p');
  rating.setAttribute("class", "rating" );
  rating.innerHTML = `Rating: ${review.rating}`;
  //li.appendChild(rating);
  ratingHeading.appendChild(rating);

  const date = document.createElement('p');
  date.setAttribute("class", "review-date" );
  date.innerHTML = `<h3> Review created at:</h3> ${new Date(review.createdAt)}  <br> 
                   <h3>Review updated at:</h3> ${new Date(review.updatedAt)}`;
  //li.appendChild(date);
  ratingHeading.appendChild(date);

  li.appendChild(ratingHeading);

  const comments = document.createElement('p');
  comments.setAttribute("class", "comments");
  comments.innerHTML = review.comments;
  li.appendChild(comments);


  return li;
}


addNewReviews = (review) => {
	const form = document.createElement('form');
	form.setAttribute('method', 'POST');
	form.setAttribute('action', 'http://localhost:1337/reviews/');
	const addReviewHeading = document.createElement('h3')
	addReviewHeading.setAttribute("class", "heading");
	addReviewHeading.innerHTML = "Add your own review";
	form.appendChild(addReviewHeading);

	const nameInput = document.createElement('input');
	nameInput.setAttribute('class', 'name-input');
	nameInput.setAttribute('type', 'text');
	nameInput.setAttribute('placeholder', 'Enter your name..');
	form.appendChild(nameInput);

	const ratingInput = document.createElement('input');
	ratingInput.setAttribute('class', 'rating-input');
	ratingInput.setAttribute('type', 'number');
	ratingInput.setAttribute('placeholder', 'Enter rating..');
	form.appendChild(ratingInput);

	const reviewInput = document.createElement('textarea');
	reviewInput.setAttribute('class', 'review-input');
	reviewInput.setAttribute('type', 'text');
	reviewInput.setAttribute('placeholder', 'Your review here..');
	form.appendChild(reviewInput);

	const reviewButton = document.createElement('button');
	reviewButton.setAttribute('class', 'review-button');
	reviewButton.setAttribute('type', 'button');
	reviewButton.setAttribute('onclick', 'buttonClick()');
	reviewButton.innerHTML = "Submit Review";
	buttonClick = () => {
	    let reviewObject = {
          "restaurant_id": self.restaurant.id,
          "name": nameInput.value,
          "createdAt": (new Date()).getTime(),
          "updatedAt": (new Date()).getTime(),
          "rating": ratingInput.value,
          "comments": reviewInput.value 
        }
        if((reviewObject.rating < 0 ) || (reviewObject.rating > 5)){
     	   window.alert("Oh, Sorry. Your rating must be a value from 0 to 5, inclusive")
        }else{
	       //http://localhost:1337/reviewspush(reviewObject);
	       console.log(review);
	    }
	}
	form.appendChild(reviewButton);

	return form;
}


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
/*
//Register ServiceWorker
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => { 
    console.log("Service Worker Registered."); 
  }).catch(() => {
    console.log("Service Worker Registration failed");
  });
}
*/
