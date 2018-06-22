// Remove expired items in cache
new CacheService().removeExpired();
// Reset residual form elements
$('form')[0].reset();

const API_BASE_URL = 'https://www.reddit.com';
let LIMIT = 10;
let CURRENT_QUERY = {limit: LIMIT, sort: 'new'};
const wrapper = document.querySelector('.wrapper');

// Add scroll event to wrapper class for infinite scroll
wrapper.addEventListener('scroll', function () {
	if (wrapper.scrollTop + wrapper.clientHeight >= wrapper.scrollHeight) {
		// Get new posts if scroll is at bottom
		getPosts(CURRENT_QUERY);
	}
});

$(document).ready(() => {
	// Populate subreddits dropdown for filter
	populateSubreddits();
	// Get initial rlatest posts for the home page
	getPosts(CURRENT_QUERY);
    // On filter form submit
	$('.search-bar').submit(function (e) {
		e.preventDefault();
		const obj = formDataToObject($(this).serializeArray());
		console.log('obj ', obj);
		const isValidSearch = Object.values(obj).some((value) => value);
		if (isValidSearch) {
			$('.content').empty();
			CURRENT_QUERY = Object.assign({}, obj);
			console.log('CURRENT_QUERY search ', CURRENT_QUERY);
			getPosts(CURRENT_QUERY);
		}
	});

	// Like a post
	$('.content').on('click', '.like', function (e) {
		$(this).find('i').addClass('red');
	});

});

// Retrieve subreddits to be used for filter
async function populateSubreddits() {
	const url = `${API_BASE_URL}/reddits.json`;
	try {
		const {data: {children}} = await $.getJSON(url);
		const subreddits = $('.subreddits');
		children.forEach((item, index) => {
			const {data} = item;
			subreddits.append(`<option value=${data.display_name}>${data.display_name}</option>`);
		});
	} catch (e) {
		console.log(e.message);
	}
}

// Get posts according to query object parameters
async function getPosts(query = {}) {
	let url = API_BASE_URL;
	// Change request url if query contains subreddits
	if (query.subreddits) {
		url += `/${query.subreddits}/search.json?`;
		CURRENT_QUERY = Object.assign({}, CURRENT_QUERY, {subreddits: query.subreddits});
		delete query.subreddits;
		query.restrict_sr = 'on';
		// Change request url if query doesn't contains subreddits but search param
	} else if (query.q && !query.subreddits) {
		url += '/search.json?';
		// Default url
	} else {
		url += '/.json?';
	}
	// Append extra parameters
	url += $.param(query);
	// Instantiate a new CacheService class
	const cacheService = new CacheService(url);
	// Check if request is cached and return it
	if (cacheService.getItem() && !cacheService.expired()) {
		const {items} = cacheService.getItem();
		fillContent(items);
		return;
	}
	const requestInfo = $('.request-info');
	//Send new request
	try {
		requestInfo.removeClass('hidden').fadeIn();
		cacheService.removeItem();
		const {data: {children, after, before}} = await $.getJSON(url);
		requestInfo.addClass('hidden').hide();
		//Populate CURRENT_QUERY to be used for next infinite scroll request
		Object.assign(CURRENT_QUERY, {after, before});
		// Cache this new request for future use
		cacheService.setItemKey(url);
		cacheService.store(children);
		fillContent(children);
	} catch (e) {
		requestInfo.addClass('hidden').hide();
		console.log(e.message);
	}

}

//Convert data from form to object
function formDataToObject(array) {
	const obj = {};
	array.forEach((item, index) => {
		if (item.name == 'dates') {
			const array = item.value.split(' - ');
			obj.date_from = new Date(array[0]).getTime();
			obj.date_to = new Date(array[1]).getTime();
		} else if (item.name == 'subreddits') {
			if (obj.subreddits) {
				obj.subreddits += `+${item.value}`;
			} else {
				obj.subreddits = `r/${item.value}`;
			}
		} else {
			obj[item.name] = item.value;
		}
	});
	return obj;
}
// Append new posts to div.content element
function fillContent(children = [], domElement = document.querySelector('.content')) {
	// domElement.empty();
	children.forEach((item, index) => {
		const {data} = item;
		domElement.appendChild(getHTMLTemplate(data));
	});
}

// Get HTML and populate template for new tile
function getHTMLTemplate(obj) {
	obj.title = obj.title.length <= 50 ? obj.title : obj.title.substring(0, 50);
	const preview = obj.preview;
	obj.preview_url = (preview && preview.images && preview.images.length) ?
		preview.images[0].source.url : 'src/images/img_placeholder.png';
	obj.thumbnail = (!obj.thumbnail || ['self', 'default', 'image'].indexOf(obj.thumbnail) > -1) ?
		'src/images/thumb.png' : obj.thumbnail;
	const div = document.createElement('div');
	div.setAttribute('class', 'tile');
	const innerHTML = `<div class="post-image-parent">
                			<img class="post-image" src=${obj.preview_url}>
            			</div>
			            <div class="post-details">
			                <p class="mt-2">${obj.title}</p>
			            </div>
			            <div class="post-insights">
			                <div class="text-sm center">
			                    <i class="fa fa-comments"></i>
			                    <strong>${obj.num_comments}</strong> <span class="mute">Comments</span>
			                </div>
			                <div class="text-sm center">
			                    <i class="fa fa-thumbs-up"></i>
			                    <strong>${obj.ups || 0}</strong> <span class="mute">Ups</span>
			                </div>
			                <div class="text-sm center">
			                    <a class="like clickable" data-post-id=${obj.id}><i class="fa fa-heart"></i> <span class="mute">Like</span></a>
			                </div>
			            </div>
			            <div class="poster-info">
			                <h6 class="poster-name mute">POSTER</h6>
			                <div class="user-bio">
			                    <div>
			                        <img src=${obj.thumbnail}>
			                    </div>
			                    <div>
			                        <p class="mt-2 mb-3 text-sm"><i class="fa fa-tag"></i> ${obj.subreddit} </p>
			                        <span class="text-sm mute">${moment.unix(obj.created_utc).utc().fromNow()}</span>
			                    </div>
			                </div>
			            </div>`;
				div.innerHTML = innerHTML;
	return div;
}
