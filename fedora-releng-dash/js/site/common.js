// Do global common things first..

// Hotpatch an 'endsWith' utility on the native String class... but
// only if no one else has done so already.
if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
}
