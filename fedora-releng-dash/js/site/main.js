// A lookup we use to figure out what branches to use.
var collections = {
    'eol': [],
    'active': [],
    'under development': [],
};

var initialize = function() {
    var urls = [
        'js/site/compose.js',
        'js/site/updates.js',
        'js/site/artifacts.js',
        'js/site/images.js',
    ];
    $.each(urls, function(i, url) { $.getScript(url); });
};

$.ajax({
    url: 'https://admin.fedoraproject.org/pkgdb/api/collections/',
    dataType: 'jsonp',
    success: function(data) {

        // Build a little lookup for ourselves.
        $.each(data.collections, function(i, collection) {
            method = 'push';
            if (collection.version == 'devel') method = 'unshift';
            collections[collection.status.toLowerCase()][method](collection);
        });

        // Rename this for niceness.
        collections.dev = collections['under development'];

        // If we're branched, then show branched elements.
        if (collections.dev.length > 1) {
            $('.branched').removeClass('hidden');
        }

        // Now, kick off all of our other scripts.
        initialize();
    },
});
