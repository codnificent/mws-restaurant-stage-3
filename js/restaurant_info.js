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
  if (!('indexedDB' in window)) {
    console.log('This browser doesn\'t support IndexedDB');
    return;
  }
  let dbPromise = idb.open('reviews-db', 1, (upgradeDb) =>{
    // If browser doesn't support service worker, there's no need having a db
    if (!navigator.serviceWorker) {
      return Promise.resolve();
    };
    if(!upgradeDb.objectStoreNames.contains('db-review-data')){
      let dbData = upgradeDb.createObjectStore('db-review-data',  {autoIncrement: true});
    }
  });
  let reviews;
  const reviews_URL = "http://localhost:1337/reviews";
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.setAttribute('tabindex', 0);
  title.innerHTML = 'Reviews';
  container.appendChild(title);
  fetch(reviews_URL).then((response) =>{
     return response.json();
  }).then((review) =>{
    reviews = review;
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
    //This checks each review against restaurants
    if(review.restaurant_id === self.restaurant.id){;
      ul.appendChild(createReviewHTML(review));
    }
    });
    ul.appendChild(addNewReviews(review));
    container.appendChild(ul);
    dbPromise.then((db) => {
        let tx = db.transaction('db-review-data', 'readwrite');
        let store = tx.objectStore('db-review-data');
        let countRequest = store.count().then(function(results) {
           if(results < 1){
             store.add(reviews);
             return tx.complete;
           }else{
             return Promise.resolve();
           }; 
        });
    });
  }).catch(() => {
  	dbPromise.then((db) => {
      let tx = db.transaction('db-data', 'readonly');
      let store = tx.objectStore('db-data');
      return store.openCursor();
    }).then(function continueCursoring(cursor) {
        if (!cursor) {
          return;
        }
        if(cursor.value){
          revieww = cursor.value;
          const ul = document.getElementById('reviews-list');
          reviews.forEach(review => {
          //This checks each review against restaurants
          if(review.restaurant_id === self.restaurant.id){;
            ul.appendChild(createReviewHTML(review));
          }
          });
          ul.appendChild(addNewReviews(review));
          container.appendChild(ul);
          console.log(reviews);
        }else{
        	if (!reviews) {
              const noReviews = document.createElement('p');
              noReviews.innerHTML = 'No reviews yet!';
              container.appendChild(noReviews);
              return;
            }
        };
        return cursor.continue().then(continueCursoring);
      });
  })
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

/*
This function is really long. This is so because it reduces the possibility
of using query sectors to target elements

And, It would've been easier is it was created in html. But, if that
 happens, the form would appear at the top of the page. This is not ideal
*/
addNewReviews = (review) => {
	const form = document.createElement('form');
	//form.setAttribute('method', 'POST');
	//form.setAttribute('action', 'http://localhost:1337/reviews/');
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
	form.appendChild(reviewButton);

	const successMessage = document.createElement('h4')
	successMessage.setAttribute("class", "heading");
	successMessage.innerHTML = "Your review has been posted. Thank you.";
	successMessage.style.display = 'none';
	form.appendChild(successMessage);

	buttonClick = (e) => {
		//reviewButton.preventDefault();
	    let reviewObject = {
          "restaurant_id": self.restaurant.id,
          "name": nameInput.value,
          "createdAt": (new Date()).getTime(),
          "updatedAt": (new Date()).getTime(),
          "rating": parseInt(ratingInput.value),
          "comments": reviewInput.value 
        }
        if((reviewObject.rating < 0 ) || (reviewObject.rating > 5) ||
        	(reviewObject.name === "") || (reviewObject.rating === "") || 
        	(reviewObject.comments === "")){
     	   window.alert(`Oh, Sorry. Your rating must be a value from 0 to 5, inclusive
     	   	And none of the fields should be empty.`)
        }else{
	       const url = 'http://localhost:1337/reviews';
           fetch(url, {
             method: 'POST', // or 'PUT'
             headers:{
               'Content-Type': 'application/json'
             }, 
             body: JSON.stringify(reviewObject)
           }).then(res => res.json())
           .then(response => console.log('Perfecto!: This is your review data..', 
           	  JSON.stringify(response)))
           .catch(error => console.error('Error:', error));
        }
        //show success alert
	    successMessage.style.display = "block";
        //Hide alert after 4 sec
        setTimeout(function(){
          successMessage.style.display = "none";
        }, 4000);

        form.reset();
	}
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

//Register ServiceWorker
/*
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').then(() => { 
    console.log("Service Worker Registered."); 
  }).catch(() => {
    console.log("Service Worker Registration failed");
  });
}
*/

