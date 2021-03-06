//Common database helper functions.
class DBHelper {
  //Fetch all restaurants.
  static fetchRestaurants(callback) {
    if (!('indexedDB' in window)) {
      console.log('This browser doesn\'t support IndexedDB');
    return;
    }
    let dbPromise = idb.open('restaurants-db', 1, (upgradeDb) =>{
      // If browser doesn't support service worker, there's no need having a db
      if (!navigator.serviceWorker) {
        return Promise.resolve();
      };
      if(!upgradeDb.objectStoreNames.contains('db-data')){
        let dbData = upgradeDb.createObjectStore('db-data',  {autoIncrement: true});
      }
    });

    let RESTAURANTS_URL = "http://localhost:1337/restaurants";
    let restaurants;
    fetch(RESTAURANTS_URL)
    .then((response) =>{
      return response.json();
    }).then((restaurant) =>{
      restaurants = restaurant;
      dbPromise.then((db) => {
        let tx = db.transaction('db-data', 'readwrite');
        let store = tx.objectStore('db-data');
        let countRequest = store.count().then(function(results) {
         if(results < 1){
          store.add(restaurants);
          return tx.complete;
        }else{
          return Promise.resolve();
        }; 
        });
      });
      callback(null, restaurants);
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
          restaurants = cursor.value;
          callback(null, restaurants);
        }else{
          const error = `Something went wrong`;
          callback(error, null)
        };
        return cursor.continue().then(continueCursoring);
      });
    }); 
  }

//Fetch a restaurant by its ID.
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`img/${restaurant.photograph + '.jpg'}`);
  }

  /**
   * Restaurant image alt tag.
   */
  static imageAltTagForRestaurant(restaurant) {
    return (`${restaurant.name}, ${restaurant.cuisine_type}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
}

