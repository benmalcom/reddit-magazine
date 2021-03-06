// The Cache class, using localStorage

// Creates a CacheService class with optional key param
function CacheService(key = null) {
	this.key = key;
	this.storage = localStorage;
}

// Set a new item key
CacheService.prototype.setItemKey = function (key) {
	this.key = key;
};

// Get an item by key
CacheService.prototype.getItem = function () {
	let item = this.storage.getItem(this.key);
	try{
		item = JSON.parse(item);
		return item;
	} catch (e) {
		console.log('Parse error ', e.message);
	}
	return null;
};

// Store a new item with expiration(default is 5minutes according to project spec)
CacheService.prototype.store = function (items, duration = 300000) {
	const obj = {expiration: Date.now() + duration, items};
	return this.storage.setItem(this.key, JSON.stringify(obj));
};

// Check if item is expired
CacheService.prototype.expired = function () {
	const item = this.getItem();
    return Date.now() > item.expiration;
};

// Remove the current item
CacheService.prototype.removeItem = function () {
	this.storage.removeItem(this.key);
};

// Remove every expired item
CacheService.prototype.removeExpired = function() {
	console.log('removing expired');
	const keys = Object.keys(localStorage);
	for(let key of keys) {
		let item = localStorage.getItem(key);
		if(item) {
			try{
				item = JSON.parse(item);
				if(item.expiration && (Date.now() > item.expiration)) {
					localStorage.removeItem(key);
				}
			} catch (e) {
				console.log('parse error ', e.message);
			}
		}
	}
};


