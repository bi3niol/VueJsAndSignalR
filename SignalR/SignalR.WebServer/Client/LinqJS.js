Array.prototype.where = function (predicate) {
    return this.filter(predicate);
};

Array.prototype.select = function (selector) {
    var res = [];
    this.forEach(function (el) {
        res.push(selector(el));
    })
    return res;
}

Array.prototype.firstOrDefault = function (predicate, _default) {
    var tmp = this.filter(predicate);
    if (tmp.length > 0) {
        return tmp[0];
    }
    return _default;
};

Array.prototype.first = function (predicate) {
    var tmp = predicate ? this.filter(predicate) : this;
    return tmp[0];
};

Array.prototype.single = function (predicate) {
    var tmp = predicate ? this.filter(predicate) : this;
    if (tmp.length != 1) {
        throw "Single : More then one maches to given predicate";
    }
    return tmp[0];
};