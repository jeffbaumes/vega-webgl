(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.vega = global.vega || {})));
}(this, (function (exports) { 'use strict';

function bin(_) {
  // determine range
  var maxb = _.maxbins || 20,
      base = _.base || 10,
      logb = Math.log(base),
      div  = _.divide || [5, 2],
      min  = _.extent[0],
      max  = _.extent[1],
      span = max - min,
      step, level, minstep, precision, v, i, n, eps;

  if (_.step) {
    // if step size is explicitly given, use that
    step = _.step;
  } else if (_.steps) {
    // if provided, limit choice to acceptable step sizes
    v = span / maxb;
    for (i=0, n=_.steps.length; i < n && _.steps[i] < v; ++i);
    step = _.steps[Math.max(0, i-1)];
  } else {
    // else use span to determine step size
    level = Math.ceil(Math.log(maxb) / logb);
    minstep = _.minstep || 0;
    step = Math.max(
      minstep,
      Math.pow(base, Math.round(Math.log(span) / logb) - level)
    );

    // increase step size if too many bins
    while (Math.ceil(span/step) > maxb) { step *= base; }

    // decrease step size if allowed
    for (i=0, n=div.length; i<n; ++i) {
      v = step / div[i];
      if (v >= minstep && span / v <= maxb) step = v;
    }
  }

  // update precision, min and max
  v = Math.log(step);
  precision = v >= 0 ? 0 : ~~(-v / logb) + 1;
  eps = Math.pow(base, -precision - 1);
  if (_.nice || _.nice === undefined) {
    min = Math.min(min, Math.floor(min / step + eps) * step);
    max = Math.ceil(max / step) * step;
  }

  return {
    start: min,
    stop:  max,
    step:  step
  };
}

function numbers(array, f) {
  var numbers = [],
      n = array.length,
      i = -1, a;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number(array[i]))) numbers.push(a);
  } else {
    while (++i < n) if (!isNaN(a = number(f(array[i], i, array)))) numbers.push(a);
  }
  return numbers;
}

function number(x) {
  return x === null ? NaN : +x;
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function bisector(compare) {
  if (compare.length === 1) compare = ascendingComparator(compare);
  return {
    left: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) < 0) lo = mid + 1;
        else hi = mid;
      }
      return lo;
    },
    right: function(a, x, lo, hi) {
      if (lo == null) lo = 0;
      if (hi == null) hi = a.length;
      while (lo < hi) {
        var mid = lo + hi >>> 1;
        if (compare(a[mid], x) > 0) hi = mid;
        else lo = mid + 1;
      }
      return lo;
    }
  };
}

function ascendingComparator(f) {
  return function(d, x) {
    return ascending(f(d), x);
  };
}

var ascendingBisect = bisector(ascending);
var bisectRight = ascendingBisect.right;
var bisectLeft = ascendingBisect.left;

function number$1(x) {
  return x === null ? NaN : +x;
}

function variance(array, f) {
  var n = array.length,
      m = 0,
      a,
      d,
      s = 0,
      i = -1,
      j = 0;

  if (f == null) {
    while (++i < n) {
      if (!isNaN(a = number$1(array[i]))) {
        d = a - m;
        m += d / ++j;
        s += d * (a - m);
      }
    }
  }

  else {
    while (++i < n) {
      if (!isNaN(a = number$1(f(array[i], i, array)))) {
        d = a - m;
        m += d / ++j;
        s += d * (a - m);
      }
    }
  }

  if (j > 1) return s / (j - 1);
}

function extent(array, f) {
  var i = -1,
      n = array.length,
      a,
      b,
      c;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }

  else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = c = b; break; }
    while (++i < n) if ((b = f(array[i], i, array)) != null) {
      if (a > b) a = b;
      if (c < b) c = b;
    }
  }

  return [a, c];
}

function range(start, stop, step) {
  start = +start, stop = +stop, step = (n = arguments.length) < 2 ? (stop = start, start = 0, 1) : n < 3 ? 1 : +step;

  var i = -1,
      n = Math.max(0, Math.ceil((stop - start) / step)) | 0,
      range = new Array(n);

  while (++i < n) {
    range[i] = start + i * step;
  }

  return range;
}

var e10 = Math.sqrt(50);
var e5 = Math.sqrt(10);
var e2 = Math.sqrt(2);
function ticks(start, stop, count) {
  var step = tickStep(start, stop, count);
  return range(
    Math.ceil(start / step) * step,
    Math.floor(stop / step) * step + step / 2, // inclusive
    step
  );
}

function tickStep(start, stop, count) {
  var step0 = Math.abs(stop - start) / Math.max(0, count),
      step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
      error = step0 / step1;
  if (error >= e10) step1 *= 10;
  else if (error >= e5) step1 *= 5;
  else if (error >= e2) step1 *= 2;
  return stop < start ? -step1 : step1;
}

function threshold(array, p, f) {
  if (f == null) f = number$1;
  if (!(n = array.length)) return;
  if ((p = +p) <= 0 || n < 2) return +f(array[0], 0, array);
  if (p >= 1) return +f(array[n - 1], n - 1, array);
  var n,
      h = (n - 1) * p,
      i = Math.floor(h),
      a = +f(array[i], i, array),
      b = +f(array[i + 1], i + 1, array);
  return a + (b - a) * (h - i);
}

function max(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = array[i]) != null && b > a) a = b;
  }

  else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = f(array[i], i, array)) != null && b > a) a = b;
  }

  return a;
}

function mean(array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1,
      j = n;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number$1(array[i]))) s += a; else --j;
  }

  else {
    while (++i < n) if (!isNaN(a = number$1(f(array[i], i, array)))) s += a; else --j;
  }

  if (j) return s / j;
}

function median(array, f) {
  var numbers = [],
      n = array.length,
      a,
      i = -1;

  if (f == null) {
    while (++i < n) if (!isNaN(a = number$1(array[i]))) numbers.push(a);
  }

  else {
    while (++i < n) if (!isNaN(a = number$1(f(array[i], i, array)))) numbers.push(a);
  }

  return threshold(numbers.sort(ascending), 0.5);
}

function merge(arrays) {
  var n = arrays.length,
      m,
      i = -1,
      j = 0,
      merged,
      array;

  while (++i < n) j += arrays[i].length;
  merged = new Array(j);

  while (--n >= 0) {
    array = arrays[n];
    m = array.length;
    while (--m >= 0) {
      merged[--j] = array[m];
    }
  }

  return merged;
}

function min(array, f) {
  var i = -1,
      n = array.length,
      a,
      b;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = array[i]) != null && a > b) a = b;
  }

  else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = b; break; }
    while (++i < n) if ((b = f(array[i], i, array)) != null && a > b) a = b;
  }

  return a;
}

function permute(array, indexes) {
  var i = indexes.length, permutes = new Array(i);
  while (i--) permutes[i] = array[indexes[i]];
  return permutes;
}

function sum(array, f) {
  var s = 0,
      n = array.length,
      a,
      i = -1;

  if (f == null) {
    while (++i < n) if (a = +array[i]) s += a; // Note: zero and null are equivalent.
  }

  else {
    while (++i < n) if (a = +f(array[i], i, array)) s += a;
  }

  return s;
}

function bootstrapCI(array, samples, alpha, f) {
  var values = numbers(array, f),
      n = values.length,
      m = samples,
      a, i, j, mu;

  for (j=0, mu=Array(m); j<m; ++j) {
    for (a=0, i=0; i<n; ++i) {
      a += values[~~(Math.random() * n)];
    }
    mu[i] = a / n;
  }

  return [
    threshold(mu.sort(ascending), alpha/2),
    threshold(mu, 1-(alpha/2))
  ];
}

function integer(min, max) {
  if (max == null) {
    max = min;
    min = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_) {
    return arguments.length
      ? (a = _ || 0, d = b - a, dist)
      : a;
  };

  dist.max = function(_) {
    return arguments.length
      ? (b = _ || 0, d = b - a, dist)
      : b;
  };

  dist.sample = function() {
    return a + Math.floor(d * Math.random());
  };

  dist.pdf = function(x) {
    return (x === Math.floor(x) && x >= a && x < b) ? 1 / d : 0;
  };

  dist.cdf = function(x) {
    var v = Math.floor(x);
    return v < a ? 0 : v >= b ? 1 : (v - a + 1) / d;
  };

  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a - 1 + Math.floor(p * d) : NaN;
  };

  return dist.min(min).max(max);
}

function randomNormal(mean, stdev) {
  var mu,
      sigma,
      next = NaN,
      dist = {};

  dist.mean = function(_) {
    return arguments.length
      ? (mu = _ || 0, next = NaN, dist)
      : mu;
  };

  dist.stdev = function(_) {
    return arguments.length
      ? (sigma = (_==null ? 1 : _), next = NaN, dist)
      : sigma;
  };

  dist.sample = function() {
    var x = 0, y = 0, rds, c;
    if (next === next) {
      return x = next, next = NaN, x;
    }
    do {
      x = Math.random() * 2 - 1;
      y = Math.random() * 2 - 1;
      rds = x * x + y * y;
    } while (rds === 0 || rds > 1);
    c = Math.sqrt(-2 * Math.log(rds) / rds); // Box-Muller transform
    next = mu + y * c * sigma;
    return mu + x * c * sigma;
  };

  dist.pdf = function(x) {
    var exp = Math.exp(Math.pow(x-mu, 2) / (-2 * Math.pow(sigma, 2)));
    return (1 / (sigma * Math.sqrt(2*Math.PI))) * exp;
  };

  // Approximation from West (2009)
  // Better Approximations to Cumulative Normal Functions
  dist.cdf = function(x) {
    var cd,
        z = (x - mu) / sigma,
        Z = Math.abs(z);
    if (Z > 37) {
      cd = 0;
    } else {
      var sum, exp = Math.exp(-Z*Z/2);
      if (Z < 7.07106781186547) {
        sum = 3.52624965998911e-02 * Z + 0.700383064443688;
        sum = sum * Z + 6.37396220353165;
        sum = sum * Z + 33.912866078383;
        sum = sum * Z + 112.079291497871;
        sum = sum * Z + 221.213596169931;
        sum = sum * Z + 220.206867912376;
        cd = exp * sum;
        sum = 8.83883476483184e-02 * Z + 1.75566716318264;
        sum = sum * Z + 16.064177579207;
        sum = sum * Z + 86.7807322029461;
        sum = sum * Z + 296.564248779674;
        sum = sum * Z + 637.333633378831;
        sum = sum * Z + 793.826512519948;
        sum = sum * Z + 440.413735824752;
        cd = cd / sum;
      } else {
        sum = Z + 0.65;
        sum = Z + 4 / sum;
        sum = Z + 3 / sum;
        sum = Z + 2 / sum;
        sum = Z + 1 / sum;
        cd = exp / sum / 2.506628274631;
      }
    }
    return z > 0 ? 1 - cd : cd;
  };

  // Approximation of Probit function using inverse error function.
  dist.icdf = function(p) {
    if (p <= 0 || p >= 1) return NaN;
    var x = 2*p - 1,
        v = (8 * (Math.PI - 3)) / (3 * Math.PI * (4-Math.PI)),
        a = (2 / (Math.PI*v)) + (Math.log(1 - Math.pow(x,2)) / 2),
        b = Math.log(1 - (x*x)) / v,
        s = (x > 0 ? 1 : -1) * Math.sqrt(Math.sqrt((a*a) - b) - a);
    return mu + sigma * Math.SQRT2 * s;
  };

  return dist.mean(mean).stdev(stdev);
}

function quartiles(array, f) {
  var values = numbers(array, f);

  return [
    threshold(values.sort(ascending), 0.25),
    threshold(values, 0.50),
    threshold(values, 0.75)
  ];
}

// TODO: support for additional kernels?
function randomKDE(support, bandwidth) {
  var kernel = randomNormal(),
      dist = {},
      n = 0;

  dist.data = function(_) {
    return arguments.length
      ? (support = _, (n = _?_.length:0), dist.bandwidth(bandwidth))
      : support;
  };

  dist.bandwidth = function(_) {
    if (!arguments.length) return bandwidth;
    bandwidth = _;
    if (!bandwidth && support) bandwidth = estimateBandwidth(support);
    return dist;
  };

  dist.sample = function() {
    return support[~~(Math.random() * n)] + bandwidth * kernel.sample();
  };

  dist.pdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.pdf((x - support[i]) / bandwidth);
    }
    return y / bandwidth / n;
  };

  dist.cdf = function(x) {
    for (var y=0, i=0; i<n; ++i) {
      y += kernel.cdf((x - support[i]) / bandwidth);
    }
    return y / n;
  };

  dist.icdf = function() {
    throw Error('KDE icdf not supported.');
  };

  return dist.data(support);
}

// Scott, D. W. (1992) Multivariate Density Estimation:
// Theory, Practice, and Visualization. Wiley.
function estimateBandwidth(array) {
  var n = array.length,
      q = quartiles(array),
      h = (q[2] - q[0]) / 1.34;
  return 1.06 * Math.min(Math.sqrt(variance(array)), h) * Math.pow(n, -0.2);
}

function randomMixture(dists, weights) {
  var dist = {}, m = 0, w;

  function normalize(x) {
    var w = [], sum = 0, i;
    for (i=0; i<m; ++i) { sum += (w[i] = (x[i]==null ? 1 : +x[i])); }
    for (i=0; i<m; ++i) { w[i] /= sum; }
    return w;
  }

  dist.weights = function(_) {
    if (arguments.length) {
      w = normalize(weights = (_ || []));
      return dist;
    }
    return weights;
  };

  dist.distributions = function(_) {
    if (arguments.length) {
      if (_) {
        m = _.length;
        dists = _;
      } else {
        m = 0;
        dists = [];
      }
      return dist.weights(weights);
    }
    return dists;
  };

  dist.sample = function() {
    var r = Math.random(),
        d = dists[m-1],
        v = w[0],
        i = 0;

    // first select distribution
    for (; i<m-1; v += w[++i]) {
      if (r < v) { d = dists[i]; break; }
    }
    // then sample from it
    return d.sample();
  };

  dist.pdf = function(x) {
    for (var p=0, i=0; i<m; ++i) {
      p += w[i] * dists[i].pdf(x);
    }
    return p;
  };

  dist.cdf = function(x) {
    for (var p=0, i=0; i<m; ++i) {
      p += w[i] * dists[i].cdf(x);
    }
    return p;
  };

  dist.icdf = function() {
    throw Error('Mixture icdf not supported.');
  };

  return dist.distributions(dists).weights(weights);
}

function randomUniform(min, max) {
  if (max == null) {
    max = (min == null ? 1 : min);
    min = 0;
  }

  var dist = {},
      a, b, d;

  dist.min = function(_) {
    return arguments.length
      ? (a = _ || 0, d = b - a, dist)
      : a;
  };

  dist.max = function(_) {
    return arguments.length
      ? (b = _ || 0, d = b - a, dist)
      : b;
  };

  dist.sample = function() {
    return a + d * Math.random();
  };

  dist.pdf = function(x) {
    return (x >= a && x <= b) ? 1 / d : 0;
  };

  dist.cdf = function(x) {
    return x < a ? 0 : x > b ? 1 : (x - a) / d;
  };

  dist.icdf = function(p) {
    return (p >= 0 && p <= 1) ? a + p * d : NaN;
  };

  return dist.min(min).max(max);
}

function accessor(fn, fields, name) {
  return (
    fn.fields = fields || [],
    fn.fname = name,
    fn
  );
}

function accessorName(fn) {
  return fn == null ? null : fn.fname;
}

function accessorFields(fn) {
  return fn == null ? null : fn.fields;
}

function splitAccessPath(p) {
  return String(p)
    .match(/\[(.*?)\]|[^.\[]+/g)
    .map(path_trim);
}

function path_trim(d) {
  return d[0] !== '[' ? d
    : d[1] !== "'" && d[1] !== '"' ? d.slice(1, -1)
    : d.slice(2, -2).replace(/\\(["'])/g, '$1');
}

var isArray = Array.isArray;

function isObject(_) {
  return _ === Object(_);
}

function isString(_) {
  return typeof _ === 'string';
}

function $(x) {
  return isArray(x) ? '[' + x.map($) + ']'
    : isObject(x) || isString(x) ?
      // Output valid JSON and JS source strings.
      // See http://timelessrepo.com/json-isnt-a-javascript-subset
      JSON.stringify(x).replace('\u2028','\\u2028').replace('\u2029', '\\u2029')
    : x;
}

function field(field, name) {
  var path = splitAccessPath(field).map($),
      fn = Function('_', 'return _[' + path.join('][') + '];');
  return accessor(fn, [field], name || field);
}

var empty = [];

var id = field('id');

var identity$1 = accessor(function(_) { return _; }, empty, 'identity');

var zero = accessor(function() { return 0; }, empty, 'zero');

var one = accessor(function() { return 1; }, empty, 'one');

var truthy = accessor(function() { return true; }, empty, 'true');

var falsy = accessor(function() { return false; }, empty, 'false');

function log(method, level, input) {
  var args = [level].concat([].slice.call(input));
  console[method].apply(console, args); // eslint-disable-line no-console
}

var None  = 0;
var Warn  = 1;
var Info  = 2;
var Debug = 3;

function logger(_) {
  var level = _ || None;
  return {
    level: function(_) {
      return arguments.length ? (level = +_, this) : level;
    },
    warn: function() {
      if (level >= Warn) log('warn', 'WARN', arguments);
      return this;
    },
    info: function() {
      if (level >= Info) log('log', 'INFO', arguments);
      return this;
    },
    debug: function() {
      if (level >= Debug) log('log', 'DEBUG', arguments);
      return this;
    }
  }
}

function array$1(_) {
  return _ != null ? (isArray(_) ? _ : [_]) : [];
}

function compare(fields, orders) {
  if (fields == null) return null;
  fields = array$1(fields);

  var cmp = fields.map(function(f) {
        return splitAccessPath(f).map($).join('][');
      }),
      ord = array$1(orders),
      n = cmp.length - 1,
      code = 'var u,v;return ', i, f, u, v, d, lt, gt;

  for (i=0; i<=n; ++i) {
    f = cmp[i];
    u = '(u=a['+f+'])';
    v = '(v=b['+f+'])';
    d = '((v=v instanceof Date?+v:v),(u=u instanceof Date?+u:u))';
    lt = ord[i] !== 'descending' ? (gt=1, -1) : (gt=-1, 1);
    code += '(' + u+'<'+v+'||u==null)&&v!=null?' + lt
      + ':(u>v||v==null)&&u!=null?' + gt
      + ':'+d+'!==u&&v===v?' + lt
      + ':v!==v&&u===u?' + gt
      + (i < n ? ':' : ':0');
  }
  return accessor(Function('a', 'b', code + ';'), fields);
}

function isFunction(_) {
  return typeof _ === 'function';
}

function constant$1(_) {
  return isFunction(_) ? _ : function() { return _; };
}

function error(message) {
  throw Error(message);
}

function extend(_) {
  for (var x, k, i=1, len=arguments.length; i<len; ++i) {
    x = arguments[i];
    for (k in x) { _[k] = x[k]; }
  }
  return _;
}

function extentIndex(array, f) {
  var i = -1,
      n = array.length,
      a, b, c, u, v;

  if (f == null) {
    while (++i < n) if ((b = array[i]) != null && b >= b) { a = c = b; break; }
    u = v = i;
    while (++i < n) if ((b = array[i]) != null) {
      if (a > b) a = b, u = i;
      if (c < b) c = b, v = i;
    }
  } else {
    while (++i < n) if ((b = f(array[i], i, array)) != null && b >= b) { a = c = b; break; }
    u = v = i;
    while (++i < n) if ((b = f(array[i], i, array)) != null) {
      if (a > b) a = b, u = i;
      if (c < b) c = b, v = i;
    }
  }

  return [u, v];
}

function inherits(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}

function isNumber(_) {
  return typeof _ === 'number';
}

function key(fields) {
  fields = fields ? array$1(fields) : fields;
  var fn = !(fields && fields.length)
    ? function() { return ''; }
    : Function('_', 'return \'\'+' +
        fields.map(function(f) {
          return '_[' + splitAccessPath(f).map($).join('][') + ']';
        }).join('+\'|\'+') + ';');
  return accessor(fn, fields, 'key');
}

function merge$1(compare, array0, array1, output) {
  var n0 = array0.length,
      n1 = array1.length;

  if (!n1) return array0;
  if (!n0) return array1;

  var merged = output || new array0.constructor(n0 + n1),
      i0 = 0, i1 = 0, i = 0;

  for (; i0<n0 && i1<n1; ++i) {
    merged[i] = compare(array0[i0], array1[i1]) > 0
       ? array1[i1++]
       : array0[i0++];
  }

  for (; i0<n0; ++i0, ++i) {
    merged[i] = array0[i0];
  }

  for (; i1<n1; ++i1, ++i) {
    merged[i] = array1[i1];
  }

  return merged;
}

function repeat(str, reps) {
  var s = '';
  while (--reps >= 0) s += str;
  return s;
}

function pad(str, length, padchar, align) {
  var c = padchar || ' ',
      n = length - str.length;

  return n <= 0 ? str
    : align === 'left' ? repeat(c, n) + str
    : align === 'center' ? repeat(c, ~~(n/2)) + str + repeat(c, Math.ceil(n/2))
    : str + repeat(c, n);
}

function peek(array) {
  return array[array.length - 1];
}

function toSet(_) {
  for (var s={}, i=0, n=_.length; i<n; ++i) s[_[i]] = 1;
  return s;
}

function truncate(str, length, align, ellipsis) {
  var e = ellipsis != null ? ellipsis : '\u2026',
      n = str.length,
      l = Math.max(0, length - e.length);

  return n <= length ? str
    : align === 'left' ? e + str.slice(n - l)
    : align === 'center' ? str.slice(0, Math.ceil(l/2)) + e + str.slice(n - ~~(l/2))
    : str.slice(0, l) + e;
}

function visitArray(array, filter, visitor) {
  if (array) {
    var i = 0, n = array.length, t;
    if (filter) {
      for (; i<n; ++i) {
        if (t = filter(array[i])) visitor(t, i, array);
      }
    } else {
      array.forEach(visitor);
    }
  }
}

var prefix = "$";

function Map() {}

Map.prototype = map$1.prototype = {
  constructor: Map,
  has: function(key) {
    return (prefix + key) in this;
  },
  get: function(key) {
    return this[prefix + key];
  },
  set: function(key, value) {
    this[prefix + key] = value;
    return this;
  },
  remove: function(key) {
    var property = prefix + key;
    return property in this && delete this[property];
  },
  clear: function() {
    for (var property in this) if (property[0] === prefix) delete this[property];
  },
  keys: function() {
    var keys = [];
    for (var property in this) if (property[0] === prefix) keys.push(property.slice(1));
    return keys;
  },
  values: function() {
    var values = [];
    for (var property in this) if (property[0] === prefix) values.push(this[property]);
    return values;
  },
  entries: function() {
    var entries = [];
    for (var property in this) if (property[0] === prefix) entries.push({key: property.slice(1), value: this[property]});
    return entries;
  },
  size: function() {
    var size = 0;
    for (var property in this) if (property[0] === prefix) ++size;
    return size;
  },
  empty: function() {
    for (var property in this) if (property[0] === prefix) return false;
    return true;
  },
  each: function(f) {
    for (var property in this) if (property[0] === prefix) f(this[property], property.slice(1), this);
  }
};

function map$1(object, f) {
  var map = new Map;

  // Copy constructor.
  if (object instanceof Map) object.each(function(value, key) { map.set(key, value); });

  // Index array by numeric index or specified key function.
  else if (Array.isArray(object)) {
    var i = -1,
        n = object.length,
        o;

    if (f == null) while (++i < n) map.set(i, object[i]);
    else while (++i < n) map.set(f(o = object[i], i, object), o);
  }

  // Convert object to map.
  else if (object) for (var key in object) map.set(key, object[key]);

  return map;
}

function nest() {
  var keys = [],
      sortKeys = [],
      sortValues,
      rollup,
      nest;

  function apply(array, depth, createResult, setResult) {
    if (depth >= keys.length) return rollup != null
        ? rollup(array) : (sortValues != null
        ? array.sort(sortValues)
        : array);

    var i = -1,
        n = array.length,
        key = keys[depth++],
        keyValue,
        value,
        valuesByKey = map$1(),
        values,
        result = createResult();

    while (++i < n) {
      if (values = valuesByKey.get(keyValue = key(value = array[i]) + "")) {
        values.push(value);
      } else {
        valuesByKey.set(keyValue, [value]);
      }
    }

    valuesByKey.each(function(values, key) {
      setResult(result, key, apply(values, depth, createResult, setResult));
    });

    return result;
  }

  function entries(map, depth) {
    if (++depth > keys.length) return map;
    var array, sortKey = sortKeys[depth - 1];
    if (rollup != null && depth >= keys.length) array = map.entries();
    else array = [], map.each(function(v, k) { array.push({key: k, values: entries(v, depth)}); });
    return sortKey != null ? array.sort(function(a, b) { return sortKey(a.key, b.key); }) : array;
  }

  return nest = {
    object: function(array) { return apply(array, 0, createObject, setObject); },
    map: function(array) { return apply(array, 0, createMap, setMap); },
    entries: function(array) { return entries(apply(array, 0, createMap, setMap), 0); },
    key: function(d) { keys.push(d); return nest; },
    sortKeys: function(order) { sortKeys[keys.length - 1] = order; return nest; },
    sortValues: function(order) { sortValues = order; return nest; },
    rollup: function(f) { rollup = f; return nest; }
  };
}

function createObject() {
  return {};
}

function setObject(object, key, value) {
  object[key] = value;
}

function createMap() {
  return map$1();
}

function setMap(map, key, value) {
  map.set(key, value);
}

var proto = map$1.prototype;

var noop = {value: function() {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$1(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

function request(url, callback) {
  var request,
      event = dispatch("beforesend", "progress", "load", "error"),
      mimeType,
      headers = map$1(),
      xhr = new XMLHttpRequest,
      user = null,
      password = null,
      response,
      responseType,
      timeout = 0;

  // If IE does not support CORS, use XDomainRequest.
  if (typeof XDomainRequest !== "undefined"
      && !("withCredentials" in xhr)
      && /^(http(s)?:)?\/\//.test(url)) xhr = new XDomainRequest;

  "onload" in xhr
      ? xhr.onload = xhr.onerror = xhr.ontimeout = respond
      : xhr.onreadystatechange = function(o) { xhr.readyState > 3 && respond(o); };

  function respond(o) {
    var status = xhr.status, result;
    if (!status && hasResponse(xhr)
        || status >= 200 && status < 300
        || status === 304) {
      if (response) {
        try {
          result = response.call(request, xhr);
        } catch (e) {
          event.call("error", request, e);
          return;
        }
      } else {
        result = xhr;
      }
      event.call("load", request, result);
    } else {
      event.call("error", request, o);
    }
  }

  xhr.onprogress = function(e) {
    event.call("progress", request, e);
  };

  request = {
    header: function(name, value) {
      name = (name + "").toLowerCase();
      if (arguments.length < 2) return headers.get(name);
      if (value == null) headers.remove(name);
      else headers.set(name, value + "");
      return request;
    },

    // If mimeType is non-null and no Accept header is set, a default is used.
    mimeType: function(value) {
      if (!arguments.length) return mimeType;
      mimeType = value == null ? null : value + "";
      return request;
    },

    // Specifies what type the response value should take;
    // for instance, arraybuffer, blob, document, or text.
    responseType: function(value) {
      if (!arguments.length) return responseType;
      responseType = value;
      return request;
    },

    timeout: function(value) {
      if (!arguments.length) return timeout;
      timeout = +value;
      return request;
    },

    user: function(value) {
      return arguments.length < 1 ? user : (user = value == null ? null : value + "", request);
    },

    password: function(value) {
      return arguments.length < 1 ? password : (password = value == null ? null : value + "", request);
    },

    // Specify how to convert the response content to a specific type;
    // changes the callback value on "load" events.
    response: function(value) {
      response = value;
      return request;
    },

    // Alias for send("GET", …).
    get: function(data, callback) {
      return request.send("GET", data, callback);
    },

    // Alias for send("POST", …).
    post: function(data, callback) {
      return request.send("POST", data, callback);
    },

    // If callback is non-null, it will be used for error and load events.
    send: function(method, data, callback) {
      xhr.open(method, url, true, user, password);
      if (mimeType != null && !headers.has("accept")) headers.set("accept", mimeType + ",*/*");
      if (xhr.setRequestHeader) headers.each(function(value, name) { xhr.setRequestHeader(name, value); });
      if (mimeType != null && xhr.overrideMimeType) xhr.overrideMimeType(mimeType);
      if (responseType != null) xhr.responseType = responseType;
      if (timeout > 0) xhr.timeout = timeout;
      if (callback == null && typeof data === "function") callback = data, data = null;
      if (callback != null && callback.length === 1) callback = fixCallback(callback);
      if (callback != null) request.on("error", callback).on("load", function(xhr) { callback(null, xhr); });
      event.call("beforesend", request, xhr);
      xhr.send(data == null ? null : data);
      return request;
    },

    abort: function() {
      xhr.abort();
      return request;
    },

    on: function() {
      var value = event.on.apply(event, arguments);
      return value === event ? request : value;
    }
  };

  if (callback != null) {
    if (typeof callback !== "function") throw new Error("invalid callback: " + callback);
    return request.get(callback);
  }

  return request;
}

function fixCallback(callback) {
  return function(error, xhr) {
    callback(error == null ? xhr : null);
  };
}

function hasResponse(xhr) {
  var type = xhr.responseType;
  return type && type !== "text"
      ? xhr.response // null on error
      : xhr.responseText; // "" on error
}

function objectConverter(columns) {
  return new Function("d", "return {" + columns.map(function(name, i) {
    return JSON.stringify(name) + ": d[" + i + "]";
  }).join(",") + "}");
}

function customConverter(columns, f) {
  var object = objectConverter(columns);
  return function(row, i) {
    return f(object(row), i, columns);
  };
}

// Compute unique columns in order of discovery.
function inferColumns(rows) {
  var columnSet = Object.create(null),
      columns = [];

  rows.forEach(function(row) {
    for (var column in row) {
      if (!(column in columnSet)) {
        columns.push(columnSet[column] = column);
      }
    }
  });

  return columns;
}

function dsvFormat(delimiter) {
  var reFormat = new RegExp("[\"" + delimiter + "\n]"),
      delimiterCode = delimiter.charCodeAt(0);

  function parse(text, f) {
    var convert, columns, rows = parseRows(text, function(row, i) {
      if (convert) return convert(row, i - 1);
      columns = row, convert = f ? customConverter(row, f) : objectConverter(row);
    });
    rows.columns = columns;
    return rows;
  }

  function parseRows(text, f) {
    var EOL = {}, // sentinel value for end-of-line
        EOF = {}, // sentinel value for end-of-file
        rows = [], // output rows
        N = text.length,
        I = 0, // current character index
        n = 0, // the current line number
        t, // the current token
        eol; // is the current token followed by EOL?

    function token() {
      if (I >= N) return EOF; // special case: end of file
      if (eol) return eol = false, EOL; // special case: end of line

      // special case: quotes
      var j = I, c;
      if (text.charCodeAt(j) === 34) {
        var i = j;
        while (i++ < N) {
          if (text.charCodeAt(i) === 34) {
            if (text.charCodeAt(i + 1) !== 34) break;
            ++i;
          }
        }
        I = i + 2;
        c = text.charCodeAt(i + 1);
        if (c === 13) {
          eol = true;
          if (text.charCodeAt(i + 2) === 10) ++I;
        } else if (c === 10) {
          eol = true;
        }
        return text.slice(j + 1, i).replace(/""/g, "\"");
      }

      // common case: find next delimiter or newline
      while (I < N) {
        var k = 1;
        c = text.charCodeAt(I++);
        if (c === 10) eol = true; // \n
        else if (c === 13) { eol = true; if (text.charCodeAt(I) === 10) ++I, ++k; } // \r|\r\n
        else if (c !== delimiterCode) continue;
        return text.slice(j, I - k);
      }

      // special case: last token before EOF
      return text.slice(j);
    }

    while ((t = token()) !== EOF) {
      var a = [];
      while (t !== EOL && t !== EOF) {
        a.push(t);
        t = token();
      }
      if (f && (a = f(a, n++)) == null) continue;
      rows.push(a);
    }

    return rows;
  }

  function format(rows, columns) {
    if (columns == null) columns = inferColumns(rows);
    return [columns.map(formatValue).join(delimiter)].concat(rows.map(function(row) {
      return columns.map(function(column) {
        return formatValue(row[column]);
      }).join(delimiter);
    })).join("\n");
  }

  function formatRows(rows) {
    return rows.map(formatRow).join("\n");
  }

  function formatRow(row) {
    return row.map(formatValue).join(delimiter);
  }

  function formatValue(text) {
    return text == null ? ""
        : reFormat.test(text += "") ? "\"" + text.replace(/\"/g, "\"\"") + "\""
        : text;
  }

  return {
    parse: parse,
    parseRows: parseRows,
    format: format,
    formatRows: formatRows
  };
}

var csv$1 = dsvFormat(",");

var tsv = dsvFormat("\t");

// Matches absolute URLs with optional protocol
//   https://...    file://...    //...
var protocol_re = /^([A-Za-z]+:)?\/\//;

// Special treatment in node.js for the file: protocol
var fileProtocol = 'file://';

// Request options to check for d3-request
var requestOptions = [
  'mimeType',
  'responseType',
  'user',
  'password'
];

/**
 * Creates a new loader instance that provides methods for requesting files
 * from either the network or disk, and for sanitizing request URIs.
 * @param {object} [options] - Optional default loading options to use.
 * @return {object} - A new loader instance.
 */
function loader(options) {
  return {
    options: options || {},
    sanitize: sanitize,
    load: load,
    file: file,
    http: http
  };
}

function marshall(loader, options) {
  return extend({}, loader.options, options);
}

/**
 * Load an external resource, typically either from the web or from the local
 * filesystem. This function uses {@link sanitize} to first sanitize the uri,
 * then calls either {@link http} (for web requests) or {@link file} (for
 * filesystem loading).
 * @param {string} uri - The resource indicator (e.g., URL or filename).
 * @param {object} [options] - Optional loading options. These options will
 *   override any existing default options.
 * @return {Promise} - A promise that resolves to the loaded content.
 */
function load(uri, options) {
  var loader = this;
  return loader.sanitize(uri, options)
    .then(function(url) {
      return (startsWith(url, fileProtocol))
        ? loader.file(url.slice(fileProtocol.length))
        : loader.http(url, options);
    });
}

/**
 * URI sanitizer function.
 * @param {string} uri - The uri (url or filename) to sanity check.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to the final URL to
 *   load, or rejects if the input uri is invalid.
 */
function sanitize(uri, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var isFile, hasProtocol, loadFile, base;

    if (uri == null || typeof uri !== 'string') {
      reject('Sanitize failure, invalid URI: ' + $(uri));
      return;
    }

    // if relative url (no protocol/host), prepend baseURL
    if ((base = options.baseURL) && !hasProtocol) {
      // Ensure that there is a slash between the baseURL (e.g. hostname) and url
      if (!startsWith(uri, '/') && base[base.length-1] !== '/') {
        uri = '/' + uri;
      }
      uri = base + uri;
    }

    isFile = startsWith(uri, fileProtocol);
    hasProtocol = protocol_re.test(uri);

    // should we load from file system?
    loadFile = isFile
      || options.mode === 'file'
      || options.mode !== 'http' && !hasProtocol && fs();

    if (loadFile) {
      // prepend file protocol, if not already present
      uri = (isFile ? '' : fileProtocol) + uri;
    } else if (startsWith(uri, '//')) {
      // if relative protocol (starts with '//'), prepend default protocol
      uri = (options.defaultProtocol || 'http') + ':' + uri;
    }

    accept(uri);
  });
}

/**
 * HTTP request loader.
 * @param {string} url - The url to request.
 * @param {object} options - An options hash.
 * @return {Promise} - A promise that resolves to the file contents.
 */
function http(url, options) {
  options = marshall(this, options);
  return new Promise(function(accept, reject) {
    var req = request(url),
        name;

    for (name in options.headers) {
      req.header(name, options.headers[name]);
    }

    requestOptions.forEach(function(name) {
      if (options[name]) req[name](options[name]);
    });

    req.on('error', function(error) {
        reject(error || 'Error loading URL: ' + url);
      })
      .on('load', function(result) {
        var text = result && result.responseText;
        (!result || result.status === 0)
          ? reject(text || 'Error')
          : accept(text);
      })
      .get();
  });
}

/**
 * File system loader.
 * @param {string} filename - The file system path to load.
 * @return {Promise} - A promise that resolves to the file contents.
 */
function file(filename) {
  return new Promise(function(accept, reject) {
    var f = fs();
    f ? f.readFile(filename, function(error, data) {
          if (error) reject(error);
          else accept(data);
        })
      : reject('No file system access for ' + filename);
  });
}

function fs() {
  return typeof require === 'function' && require('fs');
}

function startsWith(string, query) {
  return string == null ? false : string.lastIndexOf(query, 0) === 0;
}

var typeParsers = {
  boolean: toBoolean,
  integer: toNumber,
  number:  toNumber,
  date:    toDate,
  string:  toString
};

var typeTests = [
  isBoolean,
  isInteger,
  isNumber$1,
  isDate
];

var typeList = [
  'boolean',
  'integer',
  'number',
  'date'
];

function inferType(values, field) {
  var tests = typeTests.slice(),
      value, i, n, j;

  for (i=0, n=values.length; i<n; ++i) {
    value = field ? values[i][field] : values[i];
    for (j=0; j<tests.length; ++j) {
      if (isValid(value) && !tests[j](value)) {
        tests.splice(j, 1); --j;
      }
    }
    if (tests.length === 0) return 'string';
  }
  return typeList[typeTests.indexOf(tests[0])];
}

function inferTypes(data, fields) {
  return fields.reduce(function(types, field) {
    return types[field] = inferType(data, field), types;
  }, {});
}

// -- Type Coercion ----

function toNumber(_) {
  return _ == null || _ === '' ? null : +_;
}

function toBoolean(_) {
  return _ == null || _ === '' ? null : !_ || _ === 'false' ? false : !!_;
}

function toDate(_, parser) {
  return _ == null || _ === '' ? null
    : (parser ? parser(_) : Date.parse(_));
}

function toString(_) {
  return _ == null || _ === '' ? null : _ + '';
}

// -- Type Checks ----

function isValid(_) {
  return _ != null && _ === _;
}

function isBoolean(_) {
  return _ === 'true' || _ === 'false' || _ === true || _ === false;
}

function isDate(_) {
  return !isNaN(Date.parse(_));
}

function isNumber$1(_) {
  return !isNaN(+_) && !(_ instanceof Date);
}

function isInteger(_) {
  return isNumber$1(_) && (_=+_) === ~~_;
}

function delimitedFormat(delimiter) {
  return function(data, format) {
    var delim = {delimiter: delimiter};
    return dsv$1(data, format ? extend(format, delim) : delim);
  };
}

function dsv$1(data, format) {
  if (format.header) {
    data = format.header
      .map($)
      .join(format.delimiter) + '\n' + data;
  }
  return dsvFormat(format.delimiter).parse(data);
}

function isBuffer(_) {
  return (typeof Buffer === 'function' && isFunction(Buffer.isBuffer))
    ? Buffer.isBuffer(_) : false;
}

function json$1(data, format) {
  data = isObject(data) && !isBuffer(data) ? data : JSON.parse(data);
  return (format && format.property)
    ? field(format.property)(data)
    : data;
}

function noop$1() {}

function transformAbsolute(transform) {
  if (!transform) return noop$1;
  var x0,
      y0,
      kx = transform.scale[0],
      ky = transform.scale[1],
      dx = transform.translate[0],
      dy = transform.translate[1];
  return function(point, i) {
    if (!i) x0 = y0 = 0;
    point[0] = (x0 += point[0]) * kx + dx;
    point[1] = (y0 += point[1]) * ky + dy;
  };
}

function reverse(array, n) {
  var t, j = array.length, i = j - n;
  while (i < --j) t = array[i], array[i++] = array[j], array[j] = t;
}

function feature(topology, o) {
  return o.type === "GeometryCollection" ? {
    type: "FeatureCollection",
    features: o.geometries.map(function(o) { return feature$1(topology, o); })
  } : feature$1(topology, o);
}

function feature$1(topology, o) {
  var f = {
    type: "Feature",
    id: o.id,
    properties: o.properties || {},
    geometry: object(topology, o)
  };
  if (o.id == null) delete f.id;
  return f;
}

function object(topology, o) {
  var absolute = transformAbsolute(topology.transform),
      arcs = topology.arcs;

  function arc(i, points) {
    if (points.length) points.pop();
    for (var a = arcs[i < 0 ? ~i : i], k = 0, n = a.length, p; k < n; ++k) {
      points.push(p = a[k].slice());
      absolute(p, k);
    }
    if (i < 0) reverse(points, n);
  }

  function point(p) {
    p = p.slice();
    absolute(p, 0);
    return p;
  }

  function line(arcs) {
    var points = [];
    for (var i = 0, n = arcs.length; i < n; ++i) arc(arcs[i], points);
    if (points.length < 2) points.push(points[0].slice());
    return points;
  }

  function ring(arcs) {
    var points = line(arcs);
    while (points.length < 4) points.push(points[0].slice());
    return points;
  }

  function polygon(arcs) {
    return arcs.map(ring);
  }

  function geometry(o) {
    var t = o.type;
    return t === "GeometryCollection" ? {type: t, geometries: o.geometries.map(geometry)}
        : t in geometryType ? {type: t, coordinates: geometryType[t](o)}
        : null;
  }

  var geometryType = {
    Point: function(o) { return point(o.coordinates); },
    MultiPoint: function(o) { return o.coordinates.map(point); },
    LineString: function(o) { return line(o.arcs); },
    MultiLineString: function(o) { return o.arcs.map(line); },
    Polygon: function(o) { return polygon(o.arcs); },
    MultiPolygon: function(o) { return o.arcs.map(polygon); }
  };

  return geometry(o);
}

function stitchArcs(topology, arcs) {
  var stitchedArcs = {},
      fragmentByStart = {},
      fragmentByEnd = {},
      fragments = [],
      emptyIndex = -1;

  // Stitch empty arcs first, since they may be subsumed by other arcs.
  arcs.forEach(function(i, j) {
    var arc = topology.arcs[i < 0 ? ~i : i], t;
    if (arc.length < 3 && !arc[1][0] && !arc[1][1]) {
      t = arcs[++emptyIndex], arcs[emptyIndex] = i, arcs[j] = t;
    }
  });

  arcs.forEach(function(i) {
    var e = ends(i),
        start = e[0],
        end = e[1],
        f, g;

    if (f = fragmentByEnd[start]) {
      delete fragmentByEnd[f.end];
      f.push(i);
      f.end = end;
      if (g = fragmentByStart[end]) {
        delete fragmentByStart[g.start];
        var fg = g === f ? f : f.concat(g);
        fragmentByStart[fg.start = f.start] = fragmentByEnd[fg.end = g.end] = fg;
      } else {
        fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
      }
    } else if (f = fragmentByStart[end]) {
      delete fragmentByStart[f.start];
      f.unshift(i);
      f.start = start;
      if (g = fragmentByEnd[start]) {
        delete fragmentByEnd[g.end];
        var gf = g === f ? f : g.concat(f);
        fragmentByStart[gf.start = g.start] = fragmentByEnd[gf.end = f.end] = gf;
      } else {
        fragmentByStart[f.start] = fragmentByEnd[f.end] = f;
      }
    } else {
      f = [i];
      fragmentByStart[f.start = start] = fragmentByEnd[f.end = end] = f;
    }
  });

  function ends(i) {
    var arc = topology.arcs[i < 0 ? ~i : i], p0 = arc[0], p1;
    if (topology.transform) p1 = [0, 0], arc.forEach(function(dp) { p1[0] += dp[0], p1[1] += dp[1]; });
    else p1 = arc[arc.length - 1];
    return i < 0 ? [p1, p0] : [p0, p1];
  }

  function flush(fragmentByEnd, fragmentByStart) {
    for (var k in fragmentByEnd) {
      var f = fragmentByEnd[k];
      delete fragmentByStart[f.start];
      delete f.start;
      delete f.end;
      f.forEach(function(i) { stitchedArcs[i < 0 ? ~i : i] = 1; });
      fragments.push(f);
    }
  }

  flush(fragmentByEnd, fragmentByStart);
  flush(fragmentByStart, fragmentByEnd);
  arcs.forEach(function(i) { if (!stitchedArcs[i < 0 ? ~i : i]) fragments.push([i]); });

  return fragments;
}

function mesh(topology) {
  return object(topology, meshArcs.apply(this, arguments));
}

function meshArcs(topology, o, filter) {
  var arcs = [];

  function arc(i) {
    var j = i < 0 ? ~i : i;
    (geomsByArc[j] || (geomsByArc[j] = [])).push({i: i, g: geom});
  }

  function line(arcs) {
    arcs.forEach(arc);
  }

  function polygon(arcs) {
    arcs.forEach(line);
  }

  function geometry(o) {
    if (o.type === "GeometryCollection") o.geometries.forEach(geometry);
    else if (o.type in geometryType) geom = o, geometryType[o.type](o.arcs);
  }

  if (arguments.length > 1) {
    var geomsByArc = [],
        geom;

    var geometryType = {
      LineString: line,
      MultiLineString: polygon,
      Polygon: polygon,
      MultiPolygon: function(arcs) { arcs.forEach(polygon); }
    };

    geometry(o);

    geomsByArc.forEach(arguments.length < 3
        ? function(geoms) { arcs.push(geoms[0].i); }
        : function(geoms) { if (filter(geoms[0].g, geoms[geoms.length - 1].g)) arcs.push(geoms[0].i); });
  } else {
    for (var i = 0, n = topology.arcs.length; i < n; ++i) arcs.push(i);
  }

  return {type: "MultiLineString", arcs: stitchArcs(topology, arcs)};
}

function topojson(data, format) {
  var object, property;
  data = json$1(data, format);

  if (format && (property = format.feature)) {
    return (object = data.objects[property])
      ? feature(data, object).features
      : error('Invalid TopoJSON object: ' + property);
  }

  else if (format && (property = format.mesh)) {
    return (object = data.objects[property])
      ? [mesh(data, object)]
      : error('Invalid TopoJSON object: ' + property);
  }

  error('Missing TopoJSON feature or mesh parameter.');
}

var formats = {
  dsv: dsv$1,
  csv: delimitedFormat(','),
  tsv: delimitedFormat('\t'),
  json: json$1,
  topojson: topojson
};

function formats$1(name, format) {
  return arguments.length > 1 ? (formats[name] = format, this)
    : formats.hasOwnProperty(name) ? formats[name] : null;
}

var t0 = new Date;
var t1 = new Date;
function newInterval(floori, offseti, count, field) {

  function interval(date) {
    return floori(date = new Date(+date)), date;
  }

  interval.floor = interval;

  interval.ceil = function(date) {
    return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
  };

  interval.round = function(date) {
    var d0 = interval(date),
        d1 = interval.ceil(date);
    return date - d0 < d1 - date ? d0 : d1;
  };

  interval.offset = function(date, step) {
    return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
  };

  interval.range = function(start, stop, step) {
    var range = [];
    start = interval.ceil(start);
    step = step == null ? 1 : Math.floor(step);
    if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
    do range.push(new Date(+start)); while (offseti(start, step), floori(start), start < stop)
    return range;
  };

  interval.filter = function(test) {
    return newInterval(function(date) {
      if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
    }, function(date, step) {
      if (date >= date) while (--step >= 0) while (offseti(date, 1), !test(date)) {} // eslint-disable-line no-empty
    });
  };

  if (count) {
    interval.count = function(start, end) {
      t0.setTime(+start), t1.setTime(+end);
      floori(t0), floori(t1);
      return Math.floor(count(t0, t1));
    };

    interval.every = function(step) {
      step = Math.floor(step);
      return !isFinite(step) || !(step > 0) ? null
          : !(step > 1) ? interval
          : interval.filter(field
              ? function(d) { return field(d) % step === 0; }
              : function(d) { return interval.count(0, d) % step === 0; });
    };
  }

  return interval;
}

var millisecond = newInterval(function() {
  // noop
}, function(date, step) {
  date.setTime(+date + step);
}, function(start, end) {
  return end - start;
});

// An optimized implementation for this simple case.
millisecond.every = function(k) {
  k = Math.floor(k);
  if (!isFinite(k) || !(k > 0)) return null;
  if (!(k > 1)) return millisecond;
  return newInterval(function(date) {
    date.setTime(Math.floor(date / k) * k);
  }, function(date, step) {
    date.setTime(+date + step * k);
  }, function(start, end) {
    return (end - start) / k;
  });
};

var durationSecond = 1e3;
var durationMinute = 6e4;
var durationHour = 36e5;
var durationDay = 864e5;
var durationWeek = 6048e5;

var second = newInterval(function(date) {
  date.setTime(Math.floor(date / durationSecond) * durationSecond);
}, function(date, step) {
  date.setTime(+date + step * durationSecond);
}, function(start, end) {
  return (end - start) / durationSecond;
}, function(date) {
  return date.getUTCSeconds();
});

var minute = newInterval(function(date) {
  date.setTime(Math.floor(date / durationMinute) * durationMinute);
}, function(date, step) {
  date.setTime(+date + step * durationMinute);
}, function(start, end) {
  return (end - start) / durationMinute;
}, function(date) {
  return date.getMinutes();
});

var hour = newInterval(function(date) {
  var offset = date.getTimezoneOffset() * durationMinute % durationHour;
  if (offset < 0) offset += durationHour;
  date.setTime(Math.floor((+date - offset) / durationHour) * durationHour + offset);
}, function(date, step) {
  date.setTime(+date + step * durationHour);
}, function(start, end) {
  return (end - start) / durationHour;
}, function(date) {
  return date.getHours();
});

var day = newInterval(function(date) {
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setDate(date.getDate() + step);
}, function(start, end) {
  return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay;
}, function(date) {
  return date.getDate() - 1;
});

function weekday(i) {
  return newInterval(function(date) {
    date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setDate(date.getDate() + step * 7);
  }, function(start, end) {
    return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
  });
}

var timeWeek = weekday(0);
var monday = weekday(1);

var month = newInterval(function(date) {
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setMonth(date.getMonth() + step);
}, function(start, end) {
  return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
}, function(date) {
  return date.getMonth();
});

var year = newInterval(function(date) {
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
}, function(date, step) {
  date.setFullYear(date.getFullYear() + step);
}, function(start, end) {
  return end.getFullYear() - start.getFullYear();
}, function(date) {
  return date.getFullYear();
});

// An optimized implementation for this simple case.
year.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setFullYear(Math.floor(date.getFullYear() / k) * k);
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step * k);
  });
};

var utcMinute = newInterval(function(date) {
  date.setUTCSeconds(0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationMinute);
}, function(start, end) {
  return (end - start) / durationMinute;
}, function(date) {
  return date.getUTCMinutes();
});

var utcHour = newInterval(function(date) {
  date.setUTCMinutes(0, 0, 0);
}, function(date, step) {
  date.setTime(+date + step * durationHour);
}, function(start, end) {
  return (end - start) / durationHour;
}, function(date) {
  return date.getUTCHours();
});

var utcDay = newInterval(function(date) {
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCDate(date.getUTCDate() + step);
}, function(start, end) {
  return (end - start) / durationDay;
}, function(date) {
  return date.getUTCDate() - 1;
});

function utcWeekday(i) {
  return newInterval(function(date) {
    date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step * 7);
  }, function(start, end) {
    return (end - start) / durationWeek;
  });
}

var utcWeek = utcWeekday(0);
var utcMonday = utcWeekday(1);

var utcMonth = newInterval(function(date) {
  date.setUTCDate(1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCMonth(date.getUTCMonth() + step);
}, function(start, end) {
  return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
}, function(date) {
  return date.getUTCMonth();
});

var utcYear = newInterval(function(date) {
  date.setUTCMonth(0, 1);
  date.setUTCHours(0, 0, 0, 0);
}, function(date, step) {
  date.setUTCFullYear(date.getUTCFullYear() + step);
}, function(start, end) {
  return end.getUTCFullYear() - start.getUTCFullYear();
}, function(date) {
  return date.getUTCFullYear();
});

// An optimized implementation for this simple case.
utcYear.every = function(k) {
  return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
    date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step * k);
  });
};

function localDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
    date.setFullYear(d.y);
    return date;
  }
  return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
}

function utcDate(d) {
  if (0 <= d.y && d.y < 100) {
    var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
    date.setUTCFullYear(d.y);
    return date;
  }
  return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
}

function newYear(y) {
  return {y: y, m: 0, d: 1, H: 0, M: 0, S: 0, L: 0};
}

function formatLocale(locale) {
  var locale_dateTime = locale.dateTime,
      locale_date = locale.date,
      locale_time = locale.time,
      locale_periods = locale.periods,
      locale_weekdays = locale.days,
      locale_shortWeekdays = locale.shortDays,
      locale_months = locale.months,
      locale_shortMonths = locale.shortMonths;

  var periodRe = formatRe(locale_periods),
      periodLookup = formatLookup(locale_periods),
      weekdayRe = formatRe(locale_weekdays),
      weekdayLookup = formatLookup(locale_weekdays),
      shortWeekdayRe = formatRe(locale_shortWeekdays),
      shortWeekdayLookup = formatLookup(locale_shortWeekdays),
      monthRe = formatRe(locale_months),
      monthLookup = formatLookup(locale_months),
      shortMonthRe = formatRe(locale_shortMonths),
      shortMonthLookup = formatLookup(locale_shortMonths);

  var formats = {
    "a": formatShortWeekday,
    "A": formatWeekday,
    "b": formatShortMonth,
    "B": formatMonth,
    "c": null,
    "d": formatDayOfMonth,
    "e": formatDayOfMonth,
    "H": formatHour24,
    "I": formatHour12,
    "j": formatDayOfYear,
    "L": formatMilliseconds,
    "m": formatMonthNumber,
    "M": formatMinutes,
    "p": formatPeriod,
    "S": formatSeconds,
    "U": formatWeekNumberSunday,
    "w": formatWeekdayNumber,
    "W": formatWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatYear,
    "Y": formatFullYear,
    "Z": formatZone,
    "%": formatLiteralPercent
  };

  var utcFormats = {
    "a": formatUTCShortWeekday,
    "A": formatUTCWeekday,
    "b": formatUTCShortMonth,
    "B": formatUTCMonth,
    "c": null,
    "d": formatUTCDayOfMonth,
    "e": formatUTCDayOfMonth,
    "H": formatUTCHour24,
    "I": formatUTCHour12,
    "j": formatUTCDayOfYear,
    "L": formatUTCMilliseconds,
    "m": formatUTCMonthNumber,
    "M": formatUTCMinutes,
    "p": formatUTCPeriod,
    "S": formatUTCSeconds,
    "U": formatUTCWeekNumberSunday,
    "w": formatUTCWeekdayNumber,
    "W": formatUTCWeekNumberMonday,
    "x": null,
    "X": null,
    "y": formatUTCYear,
    "Y": formatUTCFullYear,
    "Z": formatUTCZone,
    "%": formatLiteralPercent
  };

  var parses = {
    "a": parseShortWeekday,
    "A": parseWeekday,
    "b": parseShortMonth,
    "B": parseMonth,
    "c": parseLocaleDateTime,
    "d": parseDayOfMonth,
    "e": parseDayOfMonth,
    "H": parseHour24,
    "I": parseHour24,
    "j": parseDayOfYear,
    "L": parseMilliseconds,
    "m": parseMonthNumber,
    "M": parseMinutes,
    "p": parsePeriod,
    "S": parseSeconds,
    "U": parseWeekNumberSunday,
    "w": parseWeekdayNumber,
    "W": parseWeekNumberMonday,
    "x": parseLocaleDate,
    "X": parseLocaleTime,
    "y": parseYear,
    "Y": parseFullYear,
    "Z": parseZone,
    "%": parseLiteralPercent
  };

  // These recursive directive definitions must be deferred.
  formats.x = newFormat(locale_date, formats);
  formats.X = newFormat(locale_time, formats);
  formats.c = newFormat(locale_dateTime, formats);
  utcFormats.x = newFormat(locale_date, utcFormats);
  utcFormats.X = newFormat(locale_time, utcFormats);
  utcFormats.c = newFormat(locale_dateTime, utcFormats);

  function newFormat(specifier, formats) {
    return function(date) {
      var string = [],
          i = -1,
          j = 0,
          n = specifier.length,
          c,
          pad,
          format;

      if (!(date instanceof Date)) date = new Date(+date);

      while (++i < n) {
        if (specifier.charCodeAt(i) === 37) {
          string.push(specifier.slice(j, i));
          if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
          else pad = c === "e" ? " " : "0";
          if (format = formats[c]) c = format(date, pad);
          string.push(c);
          j = i + 1;
        }
      }

      string.push(specifier.slice(j, i));
      return string.join("");
    };
  }

  function newParse(specifier, newDate) {
    return function(string) {
      var d = newYear(1900),
          i = parseSpecifier(d, specifier, string += "", 0);
      if (i != string.length) return null;

      // The am-pm flag is 0 for AM, and 1 for PM.
      if ("p" in d) d.H = d.H % 12 + d.p * 12;

      // Convert day-of-week and week-of-year to day-of-year.
      if ("W" in d || "U" in d) {
        if (!("w" in d)) d.w = "W" in d ? 1 : 0;
        var day = "Z" in d ? utcDate(newYear(d.y)).getUTCDay() : newDate(newYear(d.y)).getDay();
        d.m = 0;
        d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day + 5) % 7 : d.w + d.U * 7 - (day + 6) % 7;
      }

      // If a time zone is specified, all fields are interpreted as UTC and then
      // offset according to the specified time zone.
      if ("Z" in d) {
        d.H += d.Z / 100 | 0;
        d.M += d.Z % 100;
        return utcDate(d);
      }

      // Otherwise, all fields are in local time.
      return newDate(d);
    };
  }

  function parseSpecifier(d, specifier, string, j) {
    var i = 0,
        n = specifier.length,
        m = string.length,
        c,
        parse;

    while (i < n) {
      if (j >= m) return -1;
      c = specifier.charCodeAt(i++);
      if (c === 37) {
        c = specifier.charAt(i++);
        parse = parses[c in pads ? specifier.charAt(i++) : c];
        if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
      } else if (c != string.charCodeAt(j++)) {
        return -1;
      }
    }

    return j;
  }

  function parsePeriod(d, string, i) {
    var n = periodRe.exec(string.slice(i));
    return n ? (d.p = periodLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortWeekday(d, string, i) {
    var n = shortWeekdayRe.exec(string.slice(i));
    return n ? (d.w = shortWeekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseWeekday(d, string, i) {
    var n = weekdayRe.exec(string.slice(i));
    return n ? (d.w = weekdayLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseShortMonth(d, string, i) {
    var n = shortMonthRe.exec(string.slice(i));
    return n ? (d.m = shortMonthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseMonth(d, string, i) {
    var n = monthRe.exec(string.slice(i));
    return n ? (d.m = monthLookup[n[0].toLowerCase()], i + n[0].length) : -1;
  }

  function parseLocaleDateTime(d, string, i) {
    return parseSpecifier(d, locale_dateTime, string, i);
  }

  function parseLocaleDate(d, string, i) {
    return parseSpecifier(d, locale_date, string, i);
  }

  function parseLocaleTime(d, string, i) {
    return parseSpecifier(d, locale_time, string, i);
  }

  function formatShortWeekday(d) {
    return locale_shortWeekdays[d.getDay()];
  }

  function formatWeekday(d) {
    return locale_weekdays[d.getDay()];
  }

  function formatShortMonth(d) {
    return locale_shortMonths[d.getMonth()];
  }

  function formatMonth(d) {
    return locale_months[d.getMonth()];
  }

  function formatPeriod(d) {
    return locale_periods[+(d.getHours() >= 12)];
  }

  function formatUTCShortWeekday(d) {
    return locale_shortWeekdays[d.getUTCDay()];
  }

  function formatUTCWeekday(d) {
    return locale_weekdays[d.getUTCDay()];
  }

  function formatUTCShortMonth(d) {
    return locale_shortMonths[d.getUTCMonth()];
  }

  function formatUTCMonth(d) {
    return locale_months[d.getUTCMonth()];
  }

  function formatUTCPeriod(d) {
    return locale_periods[+(d.getUTCHours() >= 12)];
  }

  return {
    format: function(specifier) {
      var f = newFormat(specifier += "", formats);
      f.toString = function() { return specifier; };
      return f;
    },
    parse: function(specifier) {
      var p = newParse(specifier += "", localDate);
      p.toString = function() { return specifier; };
      return p;
    },
    utcFormat: function(specifier) {
      var f = newFormat(specifier += "", utcFormats);
      f.toString = function() { return specifier; };
      return f;
    },
    utcParse: function(specifier) {
      var p = newParse(specifier, utcDate);
      p.toString = function() { return specifier; };
      return p;
    }
  };
}

var pads = {"-": "", "_": " ", "0": "0"};
var numberRe = /^\s*\d+/;
var percentRe = /^%/;
var requoteRe = /[\\\^\$\*\+\?\|\[\]\(\)\.\{\}]/g;
function pad$1(value, fill, width) {
  var sign = value < 0 ? "-" : "",
      string = (sign ? -value : value) + "",
      length = string.length;
  return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
}

function requote(s) {
  return s.replace(requoteRe, "\\$&");
}

function formatRe(names) {
  return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
}

function formatLookup(names) {
  var map = {}, i = -1, n = names.length;
  while (++i < n) map[names[i].toLowerCase()] = i;
  return map;
}

function parseWeekdayNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 1));
  return n ? (d.w = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberSunday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.U = +n[0], i + n[0].length) : -1;
}

function parseWeekNumberMonday(d, string, i) {
  var n = numberRe.exec(string.slice(i));
  return n ? (d.W = +n[0], i + n[0].length) : -1;
}

function parseFullYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 4));
  return n ? (d.y = +n[0], i + n[0].length) : -1;
}

function parseYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
}

function parseZone(d, string, i) {
  var n = /^(Z)|([+-]\d\d)(?:\:?(\d\d))?/.exec(string.slice(i, i + 6));
  return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
}

function parseMonthNumber(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
}

function parseDayOfMonth(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.d = +n[0], i + n[0].length) : -1;
}

function parseDayOfYear(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
}

function parseHour24(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.H = +n[0], i + n[0].length) : -1;
}

function parseMinutes(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.M = +n[0], i + n[0].length) : -1;
}

function parseSeconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 2));
  return n ? (d.S = +n[0], i + n[0].length) : -1;
}

function parseMilliseconds(d, string, i) {
  var n = numberRe.exec(string.slice(i, i + 3));
  return n ? (d.L = +n[0], i + n[0].length) : -1;
}

function parseLiteralPercent(d, string, i) {
  var n = percentRe.exec(string.slice(i, i + 1));
  return n ? i + n[0].length : -1;
}

function formatDayOfMonth(d, p) {
  return pad$1(d.getDate(), p, 2);
}

function formatHour24(d, p) {
  return pad$1(d.getHours(), p, 2);
}

function formatHour12(d, p) {
  return pad$1(d.getHours() % 12 || 12, p, 2);
}

function formatDayOfYear(d, p) {
  return pad$1(1 + day.count(year(d), d), p, 3);
}

function formatMilliseconds(d, p) {
  return pad$1(d.getMilliseconds(), p, 3);
}

function formatMonthNumber(d, p) {
  return pad$1(d.getMonth() + 1, p, 2);
}

function formatMinutes(d, p) {
  return pad$1(d.getMinutes(), p, 2);
}

function formatSeconds(d, p) {
  return pad$1(d.getSeconds(), p, 2);
}

function formatWeekNumberSunday(d, p) {
  return pad$1(timeWeek.count(year(d), d), p, 2);
}

function formatWeekdayNumber(d) {
  return d.getDay();
}

function formatWeekNumberMonday(d, p) {
  return pad$1(monday.count(year(d), d), p, 2);
}

function formatYear(d, p) {
  return pad$1(d.getFullYear() % 100, p, 2);
}

function formatFullYear(d, p) {
  return pad$1(d.getFullYear() % 10000, p, 4);
}

function formatZone(d) {
  var z = d.getTimezoneOffset();
  return (z > 0 ? "-" : (z *= -1, "+"))
      + pad$1(z / 60 | 0, "0", 2)
      + pad$1(z % 60, "0", 2);
}

function formatUTCDayOfMonth(d, p) {
  return pad$1(d.getUTCDate(), p, 2);
}

function formatUTCHour24(d, p) {
  return pad$1(d.getUTCHours(), p, 2);
}

function formatUTCHour12(d, p) {
  return pad$1(d.getUTCHours() % 12 || 12, p, 2);
}

function formatUTCDayOfYear(d, p) {
  return pad$1(1 + utcDay.count(utcYear(d), d), p, 3);
}

function formatUTCMilliseconds(d, p) {
  return pad$1(d.getUTCMilliseconds(), p, 3);
}

function formatUTCMonthNumber(d, p) {
  return pad$1(d.getUTCMonth() + 1, p, 2);
}

function formatUTCMinutes(d, p) {
  return pad$1(d.getUTCMinutes(), p, 2);
}

function formatUTCSeconds(d, p) {
  return pad$1(d.getUTCSeconds(), p, 2);
}

function formatUTCWeekNumberSunday(d, p) {
  return pad$1(utcWeek.count(utcYear(d), d), p, 2);
}

function formatUTCWeekdayNumber(d) {
  return d.getUTCDay();
}

function formatUTCWeekNumberMonday(d, p) {
  return pad$1(utcMonday.count(utcYear(d), d), p, 2);
}

function formatUTCYear(d, p) {
  return pad$1(d.getUTCFullYear() % 100, p, 2);
}

function formatUTCFullYear(d, p) {
  return pad$1(d.getUTCFullYear() % 10000, p, 4);
}

function formatUTCZone() {
  return "+0000";
}

function formatLiteralPercent() {
  return "%";
}

var locale;
var timeFormat;
var timeParse;
var utcFormat;
var utcParse;

defaultLocale({
  dateTime: "%x, %X",
  date: "%-m/%-d/%Y",
  time: "%-I:%M:%S %p",
  periods: ["AM", "PM"],
  days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
});

function defaultLocale(definition) {
  locale = formatLocale(definition);
  timeFormat = locale.format;
  timeParse = locale.parse;
  utcFormat = locale.utcFormat;
  utcParse = locale.utcParse;
  return locale;
}

var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

function formatIsoNative(date) {
  return date.toISOString();
}

var formatIso = Date.prototype.toISOString
    ? formatIsoNative
    : utcFormat(isoSpecifier);

function parseIsoNative(string) {
  var date = new Date(string);
  return isNaN(date) ? null : date;
}

var parseIso = +new Date("2000-01-01T00:00:00.000Z")
    ? parseIsoNative
    : utcParse(isoSpecifier);

function read(data, schema, dateParse) {
  schema = schema || {};

  var reader = formats$1(schema.type || 'json');
  if (!reader) error('Unknown data format type: ' + schema.type);

  data = reader(data, schema);
  if (schema.parse) parse(data, schema.parse, dateParse);

  if (data.hasOwnProperty('columns')) delete data.columns;
  return data;
}

function parse(data, types, dateParse) {
  dateParse = dateParse || timeParse;

  var fields = data.columns || Object.keys(data[0]),
      parsers, datum, field, i, j, n, m;

  if (types === 'auto') types = inferTypes(data, fields);

  fields = Object.keys(types);
  parsers = fields.map(function(field) {
    var type = types[field],
        parts, pattern;

    if (type && type.indexOf('date:') === 0) {
      parts = type.split(/:(.+)?/, 2);  // split on first :
      pattern = parts[1];

      if ((pattern[0] === '\'' && pattern[pattern.length-1] === '\'') ||
          (pattern[0] === '"'  && pattern[pattern.length-1] === '"')) {
        pattern = pattern.slice(1, -1);
      }

      return dateParse(pattern);
    }

    if (!typeParsers[type]) {
      throw Error('Illegal format pattern: ' + field + ':' + type);
    }

    return typeParsers[type];
  });

  for (i=0, n=data.length, m=fields.length; i<n; ++i) {
    datum = data[i];
    for (j=0; j<m; ++j) {
      field = fields[j];
      datum[field] = parsers[j](datum[field]);
    }
  }
}

function UniqueList(idFunc) {
  var $ = idFunc || identity$1,
      list = [],
      ids = {};

  list.add = function(_) {
    var id = $(_);
    if (!ids[id]) {
      ids[id] = 1;
      list.push(_);
    }
    return list;
  };

  list.remove = function(_) {
    var id = $(_), idx;
    if (ids[id]) {
      ids[id] = 0;
      if ((idx = list.indexOf(_)) >= 0) {
        list.splice(idx, 1);
      }
    }
    return list;
  };

  return list;
}

var TUPLE_ID = 1;

/**
 * Returns the id of a tuple.
 * @param {Tuple} t - The input tuple.
 * @return the tuple id.
 */
function tupleid(t) {
  return t._id;
}

/**
 * Copy the values of one tuple to another (ignoring id and prev fields).
 * @param {Tuple} t - The tuple to copy from.
 * @param {Tuple} c - The tuple to write to.
 * @return The re-written tuple, same as the argument 'c'.
 */
function copy(t, c) {
  for (var k in t) {
    if (k !== '_id') c[k] = t[k];
  }
  return c;
}

/**
 * Ingest an object or value as a data tuple.
 * If the input value is an object, an id field will be added to it. For
 * efficiency, the input object is modified directly. A copy is not made.
 * If the input value is a literal, it will be wrapped in a new object
 * instance, with the value accessible as the 'data' property.
 * @param datum - The value to ingest.
 * @return {Tuple} The ingested data tuple.
 */
function ingest(datum) {
  var tuple = (datum === Object(datum)) ? datum : {data: datum};
  if (!tuple._id) tuple._id = ++TUPLE_ID;
  return tuple;
}

/**
 * Given a source tuple, return a derived copy.
 * @param {object} t - The source tuple.
 * @return {object} The derived tuple.
 */
function derive(t) {
  return ingest(copy(t, {}));
}

/**
 * Rederive a derived tuple by copying values from the source tuple.
 * @param {object} t - The source tuple.
 * @param {object} d - The derived tuple.
 * @return {object} The derived tuple.
 */
function rederive(t, d) {
  return copy(t, d);
}

/**
 * Replace an existing tuple with a new tuple.
 * The existing tuple will become the previous value of the new.
 * @param {object} t - The existing data tuple.
 * @param {object} d - The new tuple that replaces the old.
 * @return {object} The new tuple.
 */
function replace(t, d) {
  return d._id = t._id, d;
}

function isChangeSet(v) {
  return v && v.constructor === changeset;
}

function changeset() {
  var add = [],  // insert tuples
      rem = [],  // remove tuples
      mod = [],  // modify tuples
      remp = [], // remove by predicate
      modp = []; // modify by predicate

  return {
    constructor: changeset,
    insert: function(t) {
      var d = array$1(t), i = 0, n = d.length;
      for (; i<n; ++i) add.push(d[i]);
      return this;
    },
    remove: function(t) {
      var a = isFunction(t) ? remp : rem,
          d = array$1(t), i = 0, n = d.length;
      for (; i<n; ++i) a.push(d[i]);
      return this;
    },
    modify: function(t, field, value) {
      var m = {field: field, value: constant$1(value)};
      if (isFunction(t)) m.filter = t, modp.push(m);
      else m.tuple = t, mod.push(m);
      return this;
    },
    encode: function(t, set) {
      mod.push({tuple: t, field: set});
      return this;
    },
    pulse: function(pulse, tuples) {
      var out, i, n, m, f, t, id;

      // add
      for (i=0, n=add.length; i<n; ++i) {
        pulse.add.push(ingest(add[i]));
      }

      // remove
      for (out={}, i=0, n=rem.length; i<n; ++i) {
        t = rem[i];
        out[t._id] = t;
      }
      for (i=0, n=remp.length; i<n; ++i) {
        f = remp[i];
        tuples.forEach(function(t) {
          if (f(t)) out[t._id] = t;
        });
      }
      for (id in out) pulse.rem.push(out[id]);

      // modify
      function modify(t, f, v) {
        if (v) t[f] = v(t); else pulse.encode = f;
        out[t._id] = t;
      }
      for (out={}, i=0, n=mod.length; i<n; ++i) {
        m = mod[i];
        modify(m.tuple, m.field, m.value);
        pulse.modifies(m.field);
      }
      for (i=0, n=modp.length; i<n; ++i) {
        m = modp[i];
        f = m.filter;
        tuples.forEach(function(t) {
          if (f(t)) modify(t, m.field, m.value);
        });
        pulse.modifies(m.field);
      }
      for (id in out) pulse.mod.push(out[id]);

      return pulse;
    }
  };
}

var CACHE = '_:mod:_';

/**
 * Hash that tracks modifications to assigned values.
 * Callers *must* use the set method to update values.
 */
function Parameters() {
  Object.defineProperty(this, CACHE, {writable:true, value: {}});
}

var prototype$2 = Parameters.prototype;

function key$1(name, index) {
  return (index != null && index >= 0 ? index + ':' : '') + name;
}

/**
 * Set a parameter value. If the parameter value changes, the parameter
 * will be recorded as modified.
 * @param {string} name - The parameter name.
 * @param {number} index - The index into an array-value parameter. Ignored if
 *   the argument is undefined, null or less than zero.
 * @param {*} value - The parameter value to set.
 * @param {boolean} [force=false] - If true, records the parameter as modified
 *   even if the value is unchanged.
 * @return {Parameters} - This parameter object.
 */
prototype$2.set = function(name, index, value, force) {
  var o = this,
      v = o[name],
      mod = o[CACHE];

  if (index != null && index >= 0) {
    if (v[index] !== value || force) {
      v[index] = value;
      mod[key$1(name, index)] = 1;
      mod[name] = 1;
    }
  } else if (v !== value || force) {
    o[name] = value;
    mod[name] = 1;
    if (isArray(value)) value.forEach(function(v, i) {
      mod[key$1(name, i)] = 1;
    });
  }

  return o;
};

/**
 * Tests if one or more parameters has been modified. If invoked with no
 * arguments, returns true if any parameter value has changed. If the first
 * argument is array, returns trues if any parameter name in the array has
 * changed. Otherwise, tests if the given name and optional array index has
 * changed.
 * @param {string} name - The parameter name to test.
 * @param {number} [index=undefined] - The parameter array index to test.
 * @return {boolean} - Returns true if a queried parameter was modified.
 */
prototype$2.modified = function(name, index) {
  var mod = this[CACHE], k;
  if (!arguments.length) {
    for (k in mod) { if (mod[k]) return true; }
    return false;
  } else if (isArray(name)) {
    for (k=0; k<name.length; ++k) {
      if (mod[name[k]]) return true;
    }
    return false;
  }
  return !!mod[key$1(name, index)];
};

/**
 * Clears the modification records. After calling this method,
 * all parameters are considered unmodified.
 */
prototype$2.clear = function() {
  return this[CACHE] = {}, this;
};

var OP_ID = 0;
var PULSE = 'pulse';
var NO_PARAMS = new Parameters();

// Boolean Flags
var SKIP     = 1;
var MODIFIED = 2;
/**
 * An Operator is a processing node in a dataflow graph.
 * Each operator stores a value and an optional value update function.
 * Operators can accept a hash of named parameters. Parameter values can
 * either be direct (JavaScript literals, arrays, objects) or indirect
 * (other operators whose values will be pulled dynamically). Operators
 * included as parameters will have this operator added as a dependency.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {function(object, Pulse)} [update] - An update function. Upon
 *   evaluation of this operator, the update function will be invoked and the
 *   return value will be used as the new value of this operator.
 * @param {object} [params] - The parameters for this operator.
 * @param {boolean} [react=true] - Flag indicating if this operator should
 *   listen for changes to upstream operators included as parameters.
 * @see parameters
 */
function Operator(init, update, params, react) {
  this.id = ++OP_ID;
  this.value = init;
  this.stamp = -1;
  this.rank = -1;
  this.qrank = -1;
  this.flags = 0;

  if (update) {
    this._update = update;
  }
  if (params) this.parameters(params, react);
}

var prototype$1 = Operator.prototype;

/**
 * Returns a list of target operators dependent on this operator.
 * If this list does not exist, it is created and then returned.
 * @return {UniqueList}
 */
prototype$1.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};

/**
 * Sets the value of this operator.
 * @param {*} value - the value to set.
 * @return {Number} Returns 1 if the operator value has changed
 *   according to strict equality, returns 0 otherwise.
 */
prototype$1.set = function(value) {
  return this.value !== value ? (this.value = value, 1) : 0;
};

function flag(bit) {
  return function(state) {
    var f = this.flags;
    if (arguments.length === 0) return !!(f & bit);
    this.flags = state ? (f | bit) : (f & ~bit);
    return this;
  };
}

/**
 * Indicates that operator evaluation should be skipped on the next pulse.
 * This operator will still propagate incoming pulses, but its update function
 * will not be invoked. The skip flag is reset after every pulse, so calling
 * this method will affect processing of the next pulse only.
 */
prototype$1.skip = flag(SKIP);

/**
 * Indicates that this operator's value has been modified on its most recent
 * pulse. Normally modification is checked via strict equality; however, in
 * some cases it is more efficient to update the internal state of an object.
 * In those cases, the modified flag can be used to trigger propagation. Once
 * set, the modification flag persists across pulses until unset. The flag can
 * be used with the last timestamp to test if a modification is recent.
 */
prototype$1.modified = flag(MODIFIED);

/**
 * Sets the parameters for this operator. The parameter values are analyzed for
 * operator instances. If found, this operator will be added as a dependency
 * of the parameterizing operator. Operator values are dynamically marshalled
 * from each operator parameter prior to evaluation. If a parameter value is
 * an array, the array will also be searched for Operator instances. However,
 * the search does not recurse into sub-arrays or object properties.
 * @param {object} params - A hash of operator parameters.
 * @param {boolean} [react=true] - A flag indicating if this operator should
 *   automatically update (react) when parameter values change. In other words,
 *   this flag determines if the operator registers itself as a listener on
 *   any upstream operators included in the parameters.
 * @return {Operator[]} - An array of upstream dependencies.
 */
prototype$1.parameters = function(params, react) {
  react = react !== false;
  var self = this,
      argval = (self._argval = self._argval || new Parameters()),
      argops = (self._argops = self._argops || []),
      deps = [],
      name, value, n, i;

  function add(name, index, value) {
    if (value instanceof Operator) {
      if (value !== self) {
        if (react) value.targets().add(self);
        deps.push(value);
      }
      argops.push({op:value, name:name, index:index});
    } else {
      argval.set(name, index, value);
    }
  }

  for (name in params) {
    value = params[name];

    if (name === PULSE) {
      array$1(value).forEach(function(op) {
        if (!(op instanceof Operator)) {
          error('Pulse parameters must be operator instances.');
        } else if (op !== self) {
          op.targets().add(self);
          deps.push(op);
        }
      });
      self.source = value;
    } else if (isArray(value)) {
      argval.set(name, -1, Array(n = value.length));
      for (i=0; i<n; ++i) add(name, i, value[i]);
    } else {
      add(name, -1, value);
    }
  }

  this.marshall().clear(); // initialize values
  return deps;
};

/**
 * Internal method for marshalling parameter values.
 * Visits each operator dependency to pull the latest value.
 * @return {Parameters} A Parameters object to pass to the update function.
 */
prototype$1.marshall = function(stamp) {
  var argval = this._argval || NO_PARAMS,
      argops = this._argops, item, i, n, op, mod;

  if (argops && (n = argops.length)) {
    for (i=0; i<n; ++i) {
      item = argops[i];
      op = item.op;
      mod = op.modified() && op.stamp === stamp;
      argval.set(item.name, item.index, op.value, mod);
    }
  }
  return argval;
};

/**
 * Delegate method to perform operator processing.
 * Subclasses can override this method to perform custom processing.
 * By default, it marshalls parameters and calls the update function
 * if that function is defined. If the update function does not
 * change the operator value then StopPropagation is returned.
 * If no update function is defined, this method does nothing.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return The output pulse or StopPropagation. A falsy return value
 *   (including undefined) will let the input pulse pass through.
 */
prototype$1.evaluate = function(pulse) {
  if (this._update) {
    var params = this.marshall(pulse.stamp),
        v = this._update(params, pulse);

    params.clear();
    if (v !== this.value) {
      this.value = v;
    } else if (!this.modified()) {
      return pulse.StopPropagation;
    }
  }
};

/**
 * Run this operator for the current pulse. If this operator has already
 * been run at (or after) the pulse timestamp, returns StopPropagation.
 * Internally, this method calls {@link evaluate} to perform processing.
 * If {@link evaluate} returns a falsy value, the input pulse is returned.
 * This method should NOT be overridden, instead overrride {@link evaluate}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return the output pulse for this operator (or StopPropagation)
 */
prototype$1.run = function(pulse) {
  if (pulse.stamp <= this.stamp) return pulse.StopPropagation;
  var rv = this.skip() ? (this.skip(false), 0) : this.evaluate(pulse);
  return this.stamp = pulse.stamp, this.pulse = rv || pulse;
};

/**
 * Add an operator to the dataflow graph. This function accepts a
 * variety of input argument types. The basic signature supports an
 * initial value, update function and parameters. If the first parameter
 * is an Operator instance, it will be added directly. If it is a
 * constructor for an Operator subclass, a new instance will be instantiated.
 * Otherwise, if the first parameter is a function instance, it will be used
 * as the update function and a null initial value is assumed.
 * @param {*} init - One of: the operator to add, the initial value of
 *   the operator, an operator class to instantiate, or an update function.
 * @param {function} [update] - The operator update function.
 * @param {object} [params] - The operator parameters.
 * @param {boolean} [react=true] - Flag indicating if this operator should
 *   listen for changes to upstream operators included as parameters.
 * @return {Operator} - The added operator.
 */
function add(init, update, params, react) {
  var shift = 1,
      op = (init instanceof Operator) ? init
        : init && init.prototype instanceof Operator ? new init()
        : isFunction(init) ? new Operator(null, init)
        : (shift = 0, new Operator(init, update));

  this.rank(op);
  if (shift) react = params, params = update;
  if (params) this.connect(op, op.parameters(params, react));
  this.touch(op);

  return op;
}

/**
 * Connect a target operator as a dependent of source operators.
 * If necessary, this method will rerank the target operator and its
 * dependents to ensure propagation proceeds in a topologically sorted order.
 * @param {Operator} target - The target operator.
 * @param {Array<Operator>} - The source operators that should propagate
 *   to the target operator.
 */
function connect(target, sources) {
  var targetRank = target.rank, i, n;

  for (i=0, n=sources.length; i<n; ++i) {
    if (targetRank < sources[i].rank) {
      this.rerank(target);
      return;
    }
  }
}

var STREAM_ID = 0;

/**
 * Models an event stream.
 * @constructor
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @param {function(Object)} [receive] - Event callback function to invoke
 *   upon receipt of a new event. Use to override standard event processing.
 */
function EventStream(filter, apply, receive) {
  this.id = ++STREAM_ID;
  this.value = null;
  if (receive) this.receive = receive;
  if (filter) this._filter = filter;
  if (apply) this._apply = apply;
}

/**
 * Creates a new event stream instance with the provided
 * (optional) filter, apply and receive functions.
 * @param {function(Object, number): boolean} [filter] - Filter predicate.
 *   Events pass through when truthy, events are suppressed when falsy.
 * @param {function(Object): *} [apply] - Applied to input events to produce
 *   new event values.
 * @see EventStream
 */
function stream(filter, apply, receive) {
  return new EventStream(filter, apply, receive);
}

var prototype$3 = EventStream.prototype;

prototype$3._filter = truthy;

prototype$3._apply = identity$1;

prototype$3.targets = function() {
  return this._targets || (this._targets = UniqueList(id));
};

prototype$3.consume = function(_) {
  if (!arguments.length) return !!this._consume;
  return (this._consume = !!_, this);
};

prototype$3.receive = function(evt) {
  if (this._filter(evt)) {
    var val = (this.value = this._apply(evt)),
        trg = this._targets,
        n = trg ? trg.length : 0,
        i = 0;

    for (; i<n; ++i) trg[i].receive(val);

    if (this._consume) {
      evt.preventDefault();
      evt.stopPropagation();
    }
  }
};

prototype$3.filter = function(filter) {
  var s = stream(filter);
  return (this.targets().add(s), s);
};

prototype$3.apply = function(apply) {
  var s = stream(null, apply);
  return (this.targets().add(s), s);
};

prototype$3.merge = function() {
  var s = stream();

  this.targets().add(s);
  for (var i=0, n=arguments.length; i<n; ++i) {
    arguments[i].targets().add(s);
  }

  return s;
};

prototype$3.throttle = function(pause) {
  var t = -1;
  return this.filter(function() {
    var now = Date.now();
    return (now - t) > pause ? (t = now, 1) : 0;
  });
};

prototype$3.debounce = function(delay) {
  var s = stream(), evt = null, tid = null;

  function callback() {
    var df = evt.dataflow;
    s.receive(evt);
    evt = null; tid = null;
    if (df && df.run) df.run();
  }

  this.targets().add(stream(null, null, function(e) {
    evt = e;
    if (tid) clearTimeout(tid);
    tid = setTimeout(callback, delay);
  }));

  return s;
};

prototype$3.between = function(a, b) {
  var active = false;
  a.targets().add(stream(null, null, function() { active = true; }));
  b.targets().add(stream(null, null, function() { active = false; }));
  return this.filter(function() { return active; });
};

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor. The input must
 *  support the addEventListener method.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @param {function(object): *} [apply] - Event application function.
 *   If provided, this function will be invoked and the result will be
 *   used as the downstream event value.
 * @return {EventStream}
 */
function events(source, type, filter, apply) {
  var df = this,
      s = stream(filter, apply),
      send = function(e) {
        e.dataflow = df;
        s.receive(e);
        df.run();
      },
      sources;

  if (typeof source === 'string' && typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  } else {
    sources = array$1(source);
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  return s;
}

var SKIP$1 = {skip: true};

/**
 * Perform operator updates in response to events. Applies an
 * update function to compute a new operator value. If the update function
 * returns a {@link ChangeSet}, the operator will be pulsed with those tuple
 * changes. Otherwise, the operator value will be updated to the return value.
 * @param {EventStream|Operator} source - The event source to react to.
 *   This argument can be either an EventStream or an Operator.
 * @param {Operator|function(object):Operator} target - The operator to update.
 *   This argument can either be an Operator instance or (if the source
 *   argument is an EventStream), a function that accepts an event object as
 *   input and returns an Operator to target.
 * @param {function(Parameters,Event): *} [update] - Optional update function
 *   to compute the new operator value, or a literal value to set. Update
 *   functions expect to receive a parameter object and event as arguments.
 *   This function can either return a new operator value or (if the source
 *   argument is an EventStream) a {@link ChangeSet} instance to pulse
 *   the target operator with tuple changes.
 * @param {object} [params] - The update function parameters.
 * @param {object} [options] - Additional options hash. If not overridden,
 *   updated operators will be skipped by default.
 * @param {boolean} [options.skip] - If true, the operator will
 *  be skipped: it will not be evaluated, but its dependents will be.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @return {Dataflow}
 */
function on(source, target, update, params, options) {
  var fn = source instanceof Operator ? onOperator : onStream;
  return fn(this, source, target, update, params, options), this;
}

function onStream(df, stream, target, update, params, options) {
  var opt = extend({}, options, SKIP$1), func, op;

  if (!isFunction(target)) target = constant$1(target);

  if (update === undefined) {
    func = function(e) {
      df.touch(target(e));
    };
  } else if (isFunction(update)) {
    op = new Operator(null, update, params, false);
    func = function(e) {
      var t = target(e),
          v = (op.evaluate(e), op.value);
      isChangeSet(v) ? df.pulse(t, v, options) : df.update(t, v, opt);
    };
  } else {
    func = function(e) {
      df.update(target(e), update, opt);
    };
  }

  stream.apply(func);
}

function onOperator(df, source, target, update, params, options) {
  var func, op;

  if (update === undefined) {
    op = target;
  } else {
    func = isFunction(update) ? update : constant$1(update);
    update = !target ? func : function(_, pulse) {
      if (!target.skip()) return target.skip(true).value = func(_, pulse);
    };

    op = new Operator(null, update, params, false);
    op.modified(options && options.force);
    op.skip(true); // skip first invocation
    op.rank = 0;

    if (target) {
      op.value = target.value;
      op.targets().add(target);
    }
  }

  source.targets().add(op);
}

/**
 * Assigns a rank to an operator. Ranks are assigned in increasing order
 * by incrementing an internal rank counter.
 * @param {Operator} op - The operator to assign a rank.
 */
function rank(op) {
  op.rank = ++this._rank;
}

/**
 * Re-ranks an operator and all downstream target dependencies. This
 * is necessary when upstream depencies of higher rank are added to
 * a target operator.
 * @param {Operator} op - The operator to re-rank.
 */
function rerank(op) {
  var queue = [op],
      cur, list, i;

  while (queue.length) {
    this.rank(cur = queue.pop());
    if (list = cur._targets) {
      for (i=list.length; --i >= 0;) {
        queue.push(list[i]);
      }
    }
  }
}

/**
 * Sentinel value indicating pulse propagation should stop.
 */
var StopPropagation = {};

// Pulse visit type flags
var ADD       = (1 << 0);
var REM       = (1 << 1);
var MOD       = (1 << 2);
var ADD_REM   = ADD | REM;
var ADD_MOD   = ADD | MOD;
var ALL       = ADD | REM | MOD;
var REFLOW    = (1 << 3);
var SOURCE    = (1 << 4);
var NO_SOURCE = (1 << 5);
var NO_FIELDS = (1 << 6);
/**
 * A Pulse enables inter-operator communication during a run of the
 * dataflow graph. In addition to the current timestamp, a pulse may also
 * contain a change-set of added, removed or modified data tuples, as well as
 * a pointer to a full backing data source. Tuple change sets may not
 * be fully materialized; for example, to prevent needless array creation
 * a change set may include larger arrays and corresponding filter functions.
 * The pulse provides a {@link visit} method to enable proper and efficient
 * iteration over requested data tuples.
 *
 * In addition, each pulse can track modification flags for data tuple fields.
 * Responsible transform operators should call the {@link modifies} method to
 * indicate changes to data fields. The {@link modified} method enables
 * querying of this modification state.
 *
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The current propagation timestamp.
 * @param {string} [encode] - An optional encoding set name, which is then
 *   accessible as Pulse.encode. Operators can respond to (or ignore) this
 *   setting as appropriate. This parameter can be used in conjunction with
 *   the Encode transform in the vega-encode module.
 */
function Pulse(dataflow, stamp, encode) {
  this.dataflow = dataflow;
  this.stamp = stamp == null ? -1 : stamp;
  this.add = [];
  this.rem = [];
  this.mod = [];
  this.fields = null;
  this.encode = encode || null;
}

var prototype$4 = Pulse.prototype;

/**
 * Sentinel value indicating pulse propagation should stop.
 */
prototype$4.StopPropagation = StopPropagation;

/**
 * Boolean flag indicating ADD (added) tuples.
 */
prototype$4.ADD = ADD;

/**
 * Boolean flag indicating REM (removed) tuples.
 */
prototype$4.REM = REM;

/**
 * Boolean flag indicating MOD (modified) tuples.
 */
prototype$4.MOD = MOD;

/**
 * Boolean flag indicating ADD (added) and REM (removed) tuples.
 */
prototype$4.ADD_REM = ADD_REM;

/**
 * Boolean flag indicating ADD (added) and MOD (modified) tuples.
 */
prototype$4.ADD_MOD = ADD_MOD;

/**
 * Boolean flag indicating ADD, REM and MOD tuples.
 */
prototype$4.ALL = ALL;

/**
 * Boolean flag indicating all tuples in a data source
 * except for the ADD, REM and MOD tuples.
 */
prototype$4.REFLOW = REFLOW;

/**
 * Boolean flag indicating a 'pass-through' to a
 * backing data source, ignoring ADD, REM and MOD tuples.
 */
prototype$4.SOURCE = SOURCE;

/**
 * Boolean flag indicating that source data should be
 * suppressed when creating a forked pulse.
 */
prototype$4.NO_SOURCE = NO_SOURCE;

/**
 * Boolean flag indicating that field modifications should be
 * suppressed when creating a forked pulse.
 */
prototype$4.NO_FIELDS = NO_FIELDS;

/**
 * Creates a new pulse based on the values of this pulse.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created.
 * @return {Pulse} - The forked pulse instance.
 * @see init
 */
prototype$4.fork = function(flags) {
  return new Pulse(this.dataflow).init(this, flags);
};

/**
 * Returns a pulse that adds all tuples from a backing source. This is
 * useful for cases where operators are added to a dataflow after an
 * upstream data pipeline has already been processed, ensuring that
 * new operators can observe all tuples within a stream.
 * @return {Pulse} - A pulse instance with all source tuples included
 *   in the add array. If the current pulse already has all source
 *   tuples in its add array, it is returned directly. If the current
 *   pulse does not have a backing source, it is returned directly.
 */
prototype$4.addAll = function() {
  var p = this;
  return (!this.source || this.source.length === this.add.length) ? p
    : (p = new Pulse(this.dataflow).init(this), p.add = p.source, p);
};

/**
 * Initialize this pulse based on the values of another pulse. This method
 * is used internally by {@link fork} to initialize a new forked tuple.
 * The dataflow, time stamp and field modification values are copied over.
 * By default, new empty ADD, REM and MOD arrays are created.
 * @param {Pulse} src - The source pulse to copy from.
 * @param {number} flags - Integer of boolean flags indicating which (if any)
 *   tuple arrays should be copied to the new pulse. The supported flag values
 *   are ADD, REM and MOD. Array references are copied directly: new array
 *   instances are not created. By default, source data arrays are copied
 *   to the new pulse. Use the NO_SOURCE flag to enforce a null source.
 * @return {Pulse} - Returns this Pulse instance.
 */
prototype$4.init = function(src, flags) {
  var p = this;
  p.stamp = src.stamp;
  p.encode = src.encode;
  if (src.fields && !(flags & NO_FIELDS)) p.fields = src.fields;
  p.add = (flags & ADD) ? (p.addF = src.addF, src.add) : (p.addF = null, []);
  p.rem = (flags & REM) ? (p.remF = src.remF, src.rem) : (p.remF = null, []);
  p.mod = (flags & MOD) ? (p.modF = src.modF, src.mod) : (p.modF = null, []);
  p.source = (flags & NO_SOURCE)
    ? (p.srcF = null, null)
    : (p.srcF = src.srcF, src.source);
  return p;
};

/**
 * Schedules a function to run after pulse propagation completes.
 * @param {function} func - The function to run.
 */
prototype$4.runAfter = function(func) {
  this.dataflow.runAfter(func);
};

/**
 * Indicates if tuples have been added, removed or modified.
 * @param {number} [flags] - The tuple types (ADD, REM or MOD) to query.
 *   Defaults to ALL, returning true if any tuple type has changed.
 * @return {boolean} - Returns true if one or more queried tuple types have
 *   changed, false otherwise.
 */
prototype$4.changed = function(flags) {
  var f = flags || ALL;
  return ((f & ADD) && this.add.length)
      || ((f & REM) && this.rem.length)
      || ((f & MOD) && this.mod.length);
};

/**
 * Forces a "reflow" of tuple values, such that all tuples in the backing
 * source are added to the MOD set, unless already present in the ADD set.
 * @return {Pulse} - This pulse instance.
 */
prototype$4.reflow = function() {
  var len = this.add.length,
      src = this.source && this.source.length;
  if (src && src !== len) {
    this.mod = this.source;
    if (len) this.filter(MOD, filter(this, ADD));
  }
  return this;
};

/**
 * Marks one or more data field names as modified to assist dependency
 * tracking and incremental processing by transform operators.
 * @param {string|Array<string>} _ - The field(s) to mark as modified.
 * @return {Pulse} - This pulse instance.
 */
prototype$4.modifies = function(_) {
  var fields = array$1(_),
      hash = this.fields || (this.fields = {});
  fields.forEach(function(f) { hash[f] = true; });
  return this;
};

/**
 * Checks if one or more data fields have been modified during this pulse
 * propagation timestamp.
 * @param {string|Array<string>} _ - The field(s) to check for modified.
 * @return {boolean} - Returns true if any of the provided fields has been
 *   marked as modified, false otherwise.
 */
prototype$4.modified = function(_) {
  var fields = this.fields;
  return !(this.mod.length && fields) ? false
    : !arguments.length ? !!fields
    : isArray(_) ? _.some(function(f) { return fields[f]; })
    : fields[_];
};

/**
 * Adds a filter function to one more tuple sets. Filters are applied to
 * backing tuple arrays, to determine the actual set of tuples considered
 * added, removed or modified. They can be used to delay materialization of
 * a tuple set in order to avoid expensive array copies. In addition, the
 * filter functions can serve as value transformers: unlike standard predicate
 * function (which return boolean values), Pulse filters should return the
 * actual tuple value to process. If a tuple set is already filtered, the
 * new filter value will be appended into a conjuntive ('and') query.
 * @param {number} flags - Flags indicating the tuple set(s) to filter.
 * @param {function(*):object} filter - Filter function that will be applied
 *   to the tuple set array, and should return a data tuple if the value
 *   should be included in the tuple set, and falsy (or null) otherwise.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$4.filter = function(flags, filter) {
  var p = this;
  if (flags & ADD) p.addF = addFilter(p.addF, filter);
  if (flags & REM) p.remF = addFilter(p.remF, filter);
  if (flags & MOD) p.modF = addFilter(p.modF, filter);
  if (flags & SOURCE) p.srcF = addFilter(p.srcF, filter);
  return p;
};

function addFilter(a, b) {
  return a ? function(t,i) { return a(t,i) && b(t,i); } : b;
}

/**
 * Materialize one or more tuple sets in this pulse. If the tuple set(s) have
 * a registered filter function, it will be applied and the tuple set(s) will
 * be replaced with materialized tuple arrays.
 * @param {number} flags - Flags indicating the tuple set(s) to materialize.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$4.materialize = function(flags) {
  flags = flags || ALL;
  var p = this;
  if ((flags & ADD) && p.addF) { p.add = p.add.filter(p.addF); p.addF = null; }
  if ((flags & REM) && p.remF) { p.rem = p.rem.filter(p.remF); p.remF = null; }
  if ((flags & MOD) && p.modF) { p.mod = p.mod.filter(p.modF); p.modF = null; }
  if ((flags & SOURCE) && p.srcF) {
    p.source = p.source.filter(p.srcF); p.srcF = null;
  }
  return p;
};

function filter(pulse, flags) {
  var map = {};
  pulse.visit(flags, function(t) { map[t._id] = 1; });
  return function(t) { return map[t._id] ? null : t; };
}

/**
 * Visit one or more tuple sets in this pulse.
 * @param {number} flags - Flags indicating the tuple set(s) to visit.
 *   Legal values are ADD, REM, MOD and SOURCE (if a backing data source
 *   has been set).
 * @param {function(object):*} - Visitor function invoked per-tuple.
 * @return {Pulse} - Returns this pulse instance.
 */
prototype$4.visit = function(flags, visitor) {
  var v = visitor, src, sum;

  if (flags & SOURCE) {
    visitArray(this.source, this.srcF, v);
    return this;
  }

  if (flags & ADD) visitArray(this.add, this.addF, v);
  if (flags & REM) visitArray(this.rem, this.remF, v);
  if (flags & MOD) visitArray(this.mod, this.modF, v);

  if ((flags & REFLOW) && (src = this.source)) {
    sum = this.add.length + this.mod.length;
    if (sum === src) {
      // do nothing
    } else if (sum) {
      visitArray(src, filter(this, ADD_MOD), v);
    } else {
      // if no add/rem/mod tuples, visit source
      visitArray(src, this.srcF, v);
    }
  }

  return this;
};

var NO_OPT = {skip: false, force: false};

/**
 * Touches an operator, scheduling it to be evaluated. If invoked outside of
 * a pulse propagation, the operator will be evaluated the next time this
 * dataflow is run. If invoked in the midst of pulse propagation, the operator
 * will be queued for evaluation if and only if the operator has not yet been
 * evaluated on the current propagation timestamp.
 * @param {Operator} op - The operator to touch.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function touch(op, options) {
  var opt = options || NO_OPT;
  if (this._pulse) {
    this._enqueue(op);
  } else {
    this._touched.add(op);
  }
  if (opt.skip) op.skip(true);
  return this;
}

/**
 * Updates the value of the given operator.
 * @param {Operator} op - The operator to update.
 * @param {*} value - The value to set.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.force] - If true, the operator will
 *   be re-evaluated even if its value has not changed.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function update(op, value, options) {
  var opt = options || NO_OPT;
  if (op.set(value) || opt.force) {
    this.touch(op, opt);
  }
  return this;
}

/**
 * Pulses an operator with a changeset of tuples. If invoked outside of
 * a pulse propagation, the pulse will be applied the next time this
 * dataflow is run. If invoked in the midst of pulse propagation, the pulse
 * will be added to the set of active pulses and will be applied if and
 * only if the target operator has not yet been evaluated on the current
 * propagation timestamp.
 * @param {Operator} op - The operator to pulse.
 * @param {ChangeSet} value - The tuple changeset to apply.
 * @param {object} [options] - Additional options hash.
 * @param {boolean} [options.skip] - If true, the operator will
 *   be skipped: it will not be evaluated, but its dependents will be.
 * @return {Dataflow}
 */
function pulse(op, changeset, options) {
  var p = new Pulse(this, this._clock + (this._pulse ? 0 : 1));
  p.target = op;
  this._pulses[op.id] = changeset.pulse(p, op.value);
  return this.touch(op, options || NO_OPT);
}

function ingest$1(target, data, format) {
  return this.pulse(target, this.changeset().insert(read(data, format)));
}

function loadPending(df) {
  var pending = new Promise(function(accept) { resolve = accept; }),
      resolve;

  pending.requests = 0;

  pending.done = function() {
    if (--pending.requests === 0) {
      df.runAfter(function() {
        df._pending = null;
        df.run();
        resolve(df);
      });
    }
  }

  return (df._pending = pending);
}

function request$1(target, url, format) {
  var df = this,
      pending = df._pending || loadPending(df);

  pending.requests += 1;

  df.loader()
    .load(url, {context:'dataflow'})
    .then(
      function(data) {
        df.ingest(target, data, format);
      },
      function(error) {
        df.warn('Loading failed: ' + url, error);
        pending.done();
      })
    .then(pending.done)
    .catch(function(error) {
      df.error(error);
    });
}

/**
 * Represents a set of multiple pulses. Used as input for operators
 * that accept multiple pulses at a time. Contained pulses are
 * accessible via the public "pulses" array property. This pulse doe
 * not carry added, removed or modified tuples directly. However,
 * the visit method can be used to traverse all such tuples contained
 * in sub-pulses with a timestamp matching this parent multi-pulse.
 * @constructor
 * @param {Dataflow} dataflow - The backing dataflow instance.
 * @param {number} stamp - The timestamp.
 * @param {Array<Pulse>} pulses - The sub-pulses for this multi-pulse.
 */
function MultiPulse(dataflow, stamp, pulses, encode) {
  var p = this,
      c = 0,
      pulse, hash, i, n, f;

  this.dataflow = dataflow;
  this.stamp = stamp;
  this.fields = null;
  this.encode = encode || null;
  this.pulses = pulses;

  for (i=0, n=pulses.length; i<n; ++i) {
    pulse = pulses[i];
    if (pulse.stamp !== stamp) continue;

    if (pulse.fields) {
      hash = p.fields || (p.fields = {});
      for (f in pulse.fields) { hash[f] = 1; }
    }

    if (pulse.changed(p.ADD)) c |= p.ADD;
    if (pulse.changed(p.REM)) c |= p.REM;
    if (pulse.changed(p.MOD)) c |= p.MOD;
  }

  this.changes = c;
}

var prototype$5 = inherits(MultiPulse, Pulse);

/**
 * Creates a new pulse based on the values of this pulse.
 * The dataflow, time stamp and field modification values are copied over.
 * @return {Pulse}
 */
prototype$5.fork = function() {
  if (arguments.length && (arguments[0] & Pulse.prototype.ALL)) {
    error('MultiPulse fork does not support tuple change sets.');
  }
  return new Pulse(this.dataflow).init(this, 0);
};

prototype$5.changed = function(flags) {
  return this.changes & flags;
};

prototype$5.modified = function(_) {
  var p = this, fields = p.fields;
  return !(fields && (p.changes & p.MOD)) ? 0
    : isArray(_) ? _.some(function(f) { return fields[f]; })
    : fields[_];
};

prototype$5.filter = function() {
  error('MultiPulse does not support filtering.');
};

prototype$5.materialize = function() {
  error('MultiPulse does not support materialization.');
};

prototype$5.visit = function(flags, visitor) {
  var pulses = this.pulses, i, n;

  for (i=0, n=pulses.length; i<n; ++i) {
    if (pulses[i].stamp === this.stamp) {
      pulses[i].visit(flags, visitor);
    }
  }

  return this;
};

/**
 * Runs the dataflow. This method will increment the current timestamp
 * and process all updated, pulsed and touched operators. When run for
 * the first time, all registered operators will be processed. If there
 * are pending data loading operations, this method will return immediately
 * without evaluating the dataflow. Instead, the dataflow will be
 * asynchronously invoked when data loading completes. To track when dataflow
 * evaluation completes, use the {@link runAsync} method instead.
 * @param {string} [encode] - The name of an encoding set to invoke during
 *   propagation. This value is added to generated Pulse instances;
 *   operators can then respond to (or ignore) this setting as appropriate.
 *   This parameter can be used in conjunction with the Encode transform in
 *   the vega-encode module.
 */
function run(encode) {
  if (!this._touched.length) {
    return 0; // nothing to do!
  }

  if (this._pending) {
    this.info('Awaiting requests, delaying dataflow run.');
    return 0;
  }

  var df = this,
      count = 0,
      level = df.logLevel(),
      op, next, dt;

  df._pulse = new Pulse(df, ++df._clock, encode);

  if (level >= Info) {
    dt = Date.now();
    df.debug('-- START PROPAGATION (' + df._clock + ') -----');
  }

  // initialize queue, reset touched operators
  df._touched.forEach(function(op) { df._enqueue(op, true); });
  df._touched = UniqueList(id);

  try {
    while (df._heap.size() > 0) {
      op = df._heap.pop();

      // re-queue if rank changes
      if (op.rank !== op.qrank) { df._enqueue(op, true); continue; }

      // otherwise, evaluate the operator
      next = op.run(df._getPulse(op, encode));

      if (level >= Debug) {
        df.debug(op.id, next === StopPropagation ? 'STOP' : next, op);
      }

      // propagate the pulse
      if (next !== StopPropagation) {
        df._pulse = next;
        if (op._targets) op._targets.forEach(function(op) { df._enqueue(op); });
      }

      // increment visit counter
      ++count;
    }
  } catch (err) {
    df.error(err);
  }

  // reset pulse map
  df._pulses = {};
  df._pulse = null;

  if (level >= Info) {
    dt = Date.now() - dt;
    df.info('> Pulse ' + df._clock + ': ' + count + ' operators; ' + dt + 'ms');
  }

  // invoke callbacks queued via runAfter
  if (df._postrun.length) {
    var postrun = df._postrun;
    df._postrun = [];
    postrun.forEach(function(f) {
      try { f(df); } catch (err) { df.error(err); }
    });
  }

  return count;
}

/**
 * Runs the dataflow and returns a Promise that resolves when the
 * propagation cycle completes. The standard run method may exit early
 * if there are pending data loading operations. In contrast, this
 * method returns a Promise to allow callers to receive notification
 * when dataflow evaluation completes.
 * @return {Promise} - A promise that resolves to this dataflow.
 */
function runAsync() {
  return this._pending || Promise.resolve(this.run());
}

/**
 * Schedules a callback function to be invoked after the current pulse
 * propagation completes. If no propagation is currently occurring,
 * the function is invoked immediately.
 * @param {function(Dataflow)} callback - The callback function to run.
 *   The callback will be invoked with this Dataflow instance as its
 *   sole argument.
 */
function runAfter(callback) {
  if (this._pulse) {
    // pulse propagation is currently running, queue to run after
    this._postrun.push(callback);
  } else {
    // pulse propagation already complete, invoke immediately
    try { callback(this); } catch (err) { this.error(err); }
  }
}

/**
 * Enqueue an operator into the priority queue for evaluation. The operator
 * will be enqueued if it has no registered pulse for the current cycle, or if
 * the force argument is true. Upon enqueue, this method also sets the
 * operator's qrank to the current rank value.
 * @param {Operator} op - The operator to enqueue.
 * @param {boolean} [force] - A flag indicating if the operator should be
 *   forceably added to the queue, even if it has already been previously
 *   enqueued during the current pulse propagation. This is useful when the
 *   dataflow graph is dynamically modified and the operator rank changes.
 */
function enqueue(op, force) {
  var p = !this._pulses[op.id];
  if (p) this._pulses[op.id] = this._pulse;
  if (p || force) {
    op.qrank = op.rank;
    this._heap.push(op);
  }
}

/**
 * Provide a correct pulse for evaluating an operator. If the operator has an
 * explicit source operator, we will try to pull the pulse(s) from it.
 * If there is an array of source operators, we build a multi-pulse.
 * Otherwise, we return a current pulse with correct source data.
 * If the pulse is the pulse map has an explicit target set, we use that.
 * Else if the pulse on the upstream source operator is current, we use that.
 * Else we use the pulse from the pulse map, but copy the source tuple array.
 * @param {Operator} op - The operator for which to get an input pulse.
 * @param {string} [encode] - An (optional) encoding set name with which to
 *   annotate the returned pulse. See {@link run} for more information.
 */
function getPulse(op, encode) {
  var s = op.source,
      stamp = this._clock,
      p;

  if (s && isArray(s)) {
    p = s.map(function(_) { return _.pulse; });
    return new MultiPulse(this, stamp, p, encode);
  } else {
    s = s && s.pulse;
    p = this._pulses[op.id];
    if (s && s !== StopPropagation) {
      if (s.stamp === stamp && p.target !== op) p = s;
      else p.source = s.source;
    }
    return p;
  }
}

function Heap(comparator) {
  this.cmp = comparator;
  this.nodes = [];
}

var prototype$6 = Heap.prototype;

prototype$6.size = function() {
  return this.nodes.length;
};

prototype$6.clear = function() {
  return (this.nodes = [], this);
};

prototype$6.peek = function() {
  return this.nodes[0];
};

prototype$6.push = function(x) {
  var array = this.nodes;
  array.push(x);
  return siftdown(array, 0, array.length-1, this.cmp);
};

prototype$6.pop = function() {
  var array = this.nodes,
      last = array.pop(),
      item;

  if (array.length) {
    item = array[0];
    array[0] = last;
    siftup(array, 0, this.cmp);
  } else {
    item = last;
  }
  return item;
};

prototype$6.replace = function(item) {
  var array = this.nodes,
      retval = array[0];
  array[0] = item;
  siftup(array, 0, this.cmp);
  return retval;
};

prototype$6.pushpop = function(item) {
  var array = this.nodes, ref = array[0];
  if (array.length && this.cmp(ref, item) < 0) {
    array[0] = item;
    item = ref;
    siftup(array, 0, this.cmp);
  }
  return item;
};

function siftdown(array, start, idx, cmp) {
  var item, parent, pidx;

  item = array[idx];
  while (idx > start) {
    pidx = (idx - 1) >> 1;
    parent = array[pidx];
    if (cmp(item, parent) < 0) {
      array[idx] = parent;
      idx = pidx;
      continue;
    }
    break;
  }
  return (array[idx] = item);
}

function siftup(array, idx, cmp) {
  var start = idx,
      end = array.length,
      item = array[idx],
      cidx = 2 * idx + 1, ridx;

  while (cidx < end) {
    ridx = cidx + 1;
    if (ridx < end && cmp(array[cidx], array[ridx]) >= 0) {
      cidx = ridx;
    }
    array[idx] = array[cidx];
    idx = cidx;
    cidx = 2 * idx + 1;
  }
  array[idx] = item;
  return siftdown(array, start, idx, cmp);
}

/**
 * A dataflow graph for reactive processing of data streams.
 * @constructor
 */
function Dataflow() {
  this._log = logger();

  this._clock = 0;
  this._rank = 0;
  this._loader = loader();

  this._touched = UniqueList(id);
  this._pulses = {};
  this._pulse = null;

  this._heap = new Heap(function(a, b) { return a.qrank - b.qrank; });
  this._postrun = [];
}

var prototype = Dataflow.prototype;

/**
 * The current timestamp of this dataflow. This value reflects the
 * timestamp of the previous dataflow run. The dataflow is initialized
 * with a stamp value of 0. The initial run of the dataflow will have
 * a timestap of 1, and so on. This value will match the
 * {@link Pulse.stamp} property.
 * @return {number} - The current timestamp value.
 */
prototype.stamp = function() {
  return this._clock;
};

/**
 * Gets or sets the loader instance to use for data file loading. A
 * loader object must provide a "load" method for loading files and a
 * "sanitize" method for checking URL/filename validity. Both methods
 * should accept a URI and options hash as arguments, and return a Promise
 * that resolves to the loaded file contents or sanitized URL string,
 * respectively.
 * @param {object} _ - The loader instance to use.
 * @return {object|Dataflow} - If no arguments are provided, returns
 *   the current loader instance. Otherwise returns this Dataflow instance.
 */
prototype.loader = function(_) {
  return arguments.length ? (this._loader = _, this) : this._loader;
};

// OPERATOR REGISTRATION
prototype.add = add;
prototype.connect = connect;
prototype.rank = rank;
prototype.rerank = rerank;

// OPERATOR UPDATES
prototype.pulse = pulse;
prototype.touch = touch;
prototype.update = update;
prototype.changeset = changeset;

// DATA LOADING
prototype.ingest = ingest$1;
prototype.request = request$1;

// EVENT HANDLING
prototype.events = events;
prototype.on = on;

// PULSE PROPAGATION
prototype.run = run;
prototype.runAsync = runAsync;
prototype.runAfter = runAfter;
prototype._enqueue = enqueue;
prototype._getPulse = getPulse;

// LOGGING AND ERROR HANDLING

function logMethod(method) {
  return function() {
    return this._log[method].apply(this, arguments);
  };
}

/**
 * Logs a warning message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit warning messages.
 */
prototype.warn = logMethod('warn');

/**
 * Logs a information message. By default, logged messages are written to
 * console output. The message will only be logged if the current log level is
 * high enough to permit information messages.
 */
prototype.info = logMethod('info');

/**
 * Logs a debug message. By default, logged messages are written to console
 * output. The message will only be logged if the current log level is high
 * enough to permit debug messages.
 */
prototype.debug = logMethod('debug');

/**
 * Get or set the current log level. If an argument is provided, it
 * will be used as the new log level.
 * @param {number} [level] - Should be one of None, Warn, Info
 * @return {number} - The current log level.
 */
prototype.logLevel = logMethod('level');

/**
 * Handle an error. By default, this method re-throws the input error.
 * This method can be overridden for custom error handling.
 */
prototype.error = function(err) {
  throw err;
};

/**
 * Abstract class for operators that process data tuples.
 * Subclasses must provide a {@link transform} method for operator processing.
 * @constructor
 * @param {*} [init] - The initial value for this operator.
 * @param {object} [params] - The parameters for this operator.
 * @param {Operator} [source] - The operator from which to receive pulses.
 */
function Transform(init, params) {
  Operator.call(this, init, null, params);
}

var prototype$7 = inherits(Transform, Operator);

/**
 * Overrides {@link Operator.evaluate} for transform operators.
 * Marshalls parameter values and then invokes {@link transform}.
 * @param {Pulse} pulse - the current dataflow pulse.
 * @return {Pulse} The output pulse (or StopPropagation). A falsy return
     value (including undefined) will let the input pulse pass through.
 */
prototype$7.evaluate = function(pulse) {
  var params = this.marshall(pulse.stamp),
      out = this.transform(params, pulse);
  params.clear();
  return out;
};

/**
 * Process incoming pulses.
 * Subclasses should override this method to implement transforms.
 * @param {Parameters} _ - The operator parameter values.
 * @param {Pulse} pulse - The current dataflow pulse.
 * @return {Pulse} The output pulse (or StopPropagation). A falsy return
 *   value (including undefined) will let the input pulse pass through.
 */
prototype$7.transform = function() {};

var transforms = {};

var definitions = {};

function register(def, constructor) {
  var type = def.type;
  definition(type, def);
  transform(type, constructor);
}

function definition(type, def) {
  type = type && type.toLowerCase();
  return arguments.length > 1 ? (definitions[type] = def, this)
    : definitions.hasOwnProperty(type) ? definitions[type] : null;
}

function transform(type, constructor) {
  return arguments.length > 1 ? (transforms[type] = constructor, this)
    : transforms.hasOwnProperty(type) ? transforms[type] : null;
}

function TupleStore(key) {
  this._key = key || '_id';
  this._add = [];
  this._rem = [];
  this._ext = null;
  this._get = null;
  this._q = null;
}

var prototype$9 = TupleStore.prototype;

prototype$9.add = function(v) {
  this._add.push(v);
};

prototype$9.rem = function(v) {
  this._rem.push(v);
};

prototype$9.values = function() {
  this._get = null;
  if (this._rem.length === 0) return this._add;

  var a = this._add,
      r = this._rem,
      k = this._key,
      n = a.length,
      m = r.length,
      x = Array(n - m),
      map = {}, i, j, v;

  // use unique key field to clear removed values
  for (i=0; i<m; ++i) {
    map[r[i][k]] = 1;
  }
  for (i=0, j=0; i<n; ++i) {
    if (map[(v = a[i])[k]]) {
      map[v[k]] = 0;
    } else {
      x[j++] = v;
    }
  }

  this._rem = [];
  return (this._add = x);
};

// memoized statistics methods

prototype$9.extent = function(get) {
  if (this._get !== get || !this._ext) {
    var v = this.values(),
        i = extentIndex(v, get);
    this._ext = [v[i[0]], v[i[1]]];
    this._get = get;
  }
  return this._ext;
};

prototype$9.argmin = function(get) {
  return this.extent(get)[0] || {};
};

prototype$9.argmax = function(get) {
  return this.extent(get)[1] || {};
};

prototype$9.min = function(get) {
  var m = this.extent(get)[0];
  return m != null ? get(m) : +Infinity;
};

prototype$9.max = function(get) {
  var m = this.extent(get)[1];
  return m != null ? get(m) : -Infinity;
};

prototype$9.quartile = function(get) {
  if (this._get !== get || !this._q) {
    this._q = quartiles(this.values(), get);
    this._get = get;
  }
  return this._q;
};

prototype$9.q1 = function(get) {
  return this.quartile(get)[0];
};

prototype$9.q2 = function(get) {
  return this.quartile(get)[1];
};

prototype$9.q3 = function(get) {
  return this.quartile(get)[2];
};

prototype$9.ci = function(get) {
  if (this._get !== get || !this._ci) {
    this._ci = bootstrapCI(this.values(), 1000, 0.05, get);
    this._get = get;
  }
  return this._ci;
};

prototype$9.ci0 = function(get) {
  return this.ci(get)[0];
};

prototype$9.ci1 = function(get) {
  return this.ci(get)[1];
};

var Aggregates = {
  'values': measure({
    name: 'values',
    init: 'cell.store = true;',
    set:  'cell.data.values()', idx: -1
  }),
  'count': measure({
    name: 'count',
    set:  'cell.num'
  }),
  'missing': measure({
    name: 'missing',
    set:  'this.missing'
  }),
  'valid': measure({
    name: 'valid',
    set:  'this.valid'
  }),
  'distinct': measure({
    name: 'distinct',
    init: 'this.dmap = {}; this.distinct = 0;',
    add:  'this.dmap[v] = 1 + (this.dmap[v] || (++this.distinct, 0));',
    rem:  'if (!(--this.dmap[v])) --this.distinct;',
    set:  'this.distinct'
  }),
  'sum': measure({
    name: 'sum',
    init: 'this.sum = 0;',
    add:  'this.sum += v;',
    rem:  'this.sum -= v;',
    set:  'this.sum'
  }),
  'mean': measure({
    name: 'mean',
    init: 'this.mean = 0;',
    add:  'var d = v - this.mean; this.mean += d / this.valid;',
    rem:  'var d = v - this.mean; this.mean -= this.valid ? d / this.valid : this.mean;',
    set:  'this.mean'
  }),
  'average': measure({
    name: 'average',
    set:  'this.mean',
    req:  ['mean'], idx: 1
  }),
  'variance': measure({
    name: 'variance',
    init: 'this.dev = 0;',
    add:  'this.dev += d * (v - this.mean);',
    rem:  'this.dev -= d * (v - this.mean);',
    set:  'this.valid > 1 ? this.dev / (this.valid-1) : 0',
    req:  ['mean'], idx: 1
  }),
  'variancep': measure({
    name: 'variancep',
    set:  'this.valid > 1 ? this.dev / this.valid : 0',
    req:  ['variance'], idx: 2
  }),
  'stdev': measure({
    name: 'stdev',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid-1)) : 0',
    req:  ['variance'], idx: 2
  }),
  'stdevp': measure({
    name: 'stdevp',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / this.valid) : 0',
    req:  ['variance'], idx: 2
  }),
  'stderr': measure({
    name: 'stderr',
    set:  'this.valid > 1 ? Math.sqrt(this.dev / (this.valid * (this.valid-1))) : 0',
    req:  ['variance'], idx: 2
  }),
  'ci0': measure({
    name: 'ci0',
    set:  'cell.data.ci0(this.get)',
    req:  ['values'], idx: 3
  }),
  'ci1': measure({
    name: 'ci1',
    set:  'cell.data.ci1(this.get)',
    req:  ['values'], idx: 3
  }),
  'median': measure({
    name: 'median',
    set:  'cell.data.q2(this.get)',
    req:  ['values'], idx: 3
  }),
  'q1': measure({
    name: 'q1',
    set:  'cell.data.q1(this.get)',
    req:  ['values'], idx: 3
  }),
  'q3': measure({
    name: 'q3',
    set:  'cell.data.q3(this.get)',
    req:  ['values'], idx: 3
  }),
  'argmin': measure({
    name: 'argmin',
    add:  'if (v < this.min) this.argmin = t;',
    rem:  'if (v <= this.min) this.argmin = null;',
    set:  'this.argmin || cell.data.argmin(this.get)',
    req:  ['min'], str: ['values'], idx: 3
  }),
  'argmax': measure({
    name: 'argmax',
    add:  'if (v > this.max) this.argmax = t;',
    rem:  'if (v >= this.max) this.argmax = null;',
    set:  'this.argmax || cell.data.argmax(this.get)',
    req:  ['max'], str: ['values'], idx: 3
  }),
  'min': measure({
    name: 'min',
    init: 'this.min = null;',
    add:  'if (v < this.min || this.min === null) this.min = v;',
    rem:  'if (v <= this.min) this.min = NaN;',
    set:  'this.min = (isNaN(this.min) ? cell.data.min(this.get) : this.min)',
    str:  ['values'], idx: 4
  }),
  'max': measure({
    name: 'max',
    init: 'this.max = null;',
    add:  'if (v > this.max || this.max === null) this.max = v;',
    rem:  'if (v >= this.max) this.max = NaN;',
    set:  'this.max = (isNaN(this.max) ? cell.data.max(this.get) : this.max)',
    str:  ['values'], idx: 4
  })
};

function createMeasure(op, name) {
  return Aggregates[op](name);
}

function measure(base) {
  return function(out) {
    var m = extend({init:'', add:'', rem:'', idx:0}, base);
    m.out = out || base.name;
    return m;
  };
}

function compareIndex(a, b) {
  return a.idx - b.idx;
}

function resolve(agg, stream) {
  function collect(m, a) {
    function helper(r) { if (!m[r]) collect(m, m[r] = Aggregates[r]()); }
    if (a.req) a.req.forEach(helper);
    if (stream && a.str) a.str.forEach(helper);
    return m;
  }
  var map = agg.reduce(
    collect,
    agg.reduce(function(m, a) { return (m[a.name] = a, m); }, {})
  );
  var values = [], key;
  for (key in map) values.push(map[key]);
  return values.sort(compareIndex);
}

function compileMeasures(agg, field) {
  var get = field || identity$1,
      all = resolve(agg, true), // assume streaming removes may occur
      ctr = 'this.cell = cell; this.tuple = t; this.valid = 0; this.missing = 0;',
      add = 'if(v==null){this.missing++; return;} if(v!==v) return; ++this.valid;',
      rem = 'if(v==null){this.missing--; return;} if(v!==v) return; --this.valid;',
      set = 'var t = this.tuple; var cell = this.cell;';

  all.forEach(function(a) {
    if (a.idx < 0) {
      ctr = a.init + ctr;
      add = a.add + add;
      rem = a.rem + rem;
    } else {
      ctr += a.init;
      add += a.add;
      rem += a.rem;
    }
  });
  agg.slice().sort(compareIndex).forEach(function(a) {
    set += 't[\'' + a.out + '\']=' + a.set + ';';
  });
  set += 'return t;';

  ctr = Function('cell', 't', ctr);
  ctr.prototype.add = Function('v', 't', add);
  ctr.prototype.rem = Function('v', 't', rem);
  ctr.prototype.set = Function(set);
  ctr.prototype.get = get;
  ctr.fields = agg.map(function(_) { return _.out; });
  return ctr;
}

/**
 * Group-by aggregation operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.groupby - An array of accessors to groupby.
 * @param {Array<function(object): *>} params.fields - An array of accessors to aggregate.
 * @param {Array<string>} params.ops - An array of strings indicating aggregation operations.
 * @param {Array<string>} [params.as] - An array of output field names for aggregated values.
 * @param {boolean} [params.drop=true] - A flag indicating if empty cells should be removed.
 */
function Aggregate(params) {
  Transform.call(this, null, params);

  this._adds = []; // array of added output tuples
  this._mods = []; // array of modified output tuples
  this._alen = 0;  // number of active added tuples
  this._mlen = 0;  // number of active modified tuples
  this._drop = true; // should empty aggregation cells be removed

  this._dims = [];   // group-by dimension accessors
  this._dnames = []; // group-by dimension names

  this._measures = []; // collection of aggregation monoids
  this._countOnly = false; // flag indicating only count aggregation
  this._counts = null; // collection of count fields
  this._prev = null;   // previous aggregation cells

  this._inputs = null;  // array of dependent input tuple field names
  this._outputs = null; // array of output tuple field names
}

var prototype$8 = inherits(Aggregate, Transform);

prototype$8.transform = function(_, pulse) {
  var aggr = this,
      out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      mod;

  this.stamp = out.stamp;

  if (this.value && ((mod = _.modified()) || pulse.modified(this._inputs))) {
    this._prev = this.value;
    this.value = mod ? this.init(_) : {};
    pulse.visit(pulse.SOURCE, function(t) { aggr.add(t); });
  } else {
    this.value = this.value || this.init(_);
    pulse.visit(pulse.REM, function(t) { aggr.rem(t); });
    pulse.visit(pulse.ADD, function(t) { aggr.add(t); });
  }

  // Indicate output fields and return aggregate tuples.
  out.modifies(this._outputs);

  aggr._drop = _.drop !== false;
  return aggr.changes(out);
};

prototype$8.init = function(_) {
  // initialize input and output fields
  var inputs = (this._inputs = []),
      outputs = (this._outputs = []),
      inputMap = {};

  function inputVisit(get) {
    var fields = get.fields, i = 0, n = fields.length, f;
    for (; i<n; ++i) {
      if (!inputMap[f=fields[i]]) {
        inputMap[f] = 1;
        inputs.push(f);
      }
    }
  }

  // initialize group-by dimensions
  this._dims = array$1(_.groupby);
  this._dnames = this._dims.map(function(d) {
    var dname = accessorName(d)
    return (inputVisit(d), outputs.push(dname), dname);
  });
  this.cellkey = _.key ? _.key
    : this._dims.length === 0 ? function() { return ''; }
    : this._dims.length === 1 ? this._dims[0]
    : cellkey;

  // initialize aggregate measures
  this._countOnly = true;
  this._counts = [];
  this._measures = [];

  var fields = _.fields || [null],
      ops = _.ops || ['count'],
      as = _.as || [],
      n = fields.length,
      map = {},
      field, op, m, mname, outname, i;

  if (n !== ops.length) {
    error('Unmatched number of fields and aggregate ops.');
  }

  for (i=0; i<n; ++i) {
    field = fields[i];
    op = ops[i];

    if (field == null && op !== 'count') {
      error('Null aggregate field specified.');
    }
    mname = accessorName(field);
    outname = measureName(op, mname, as[i]);
    outputs.push(outname);

    if (op === 'count') {
      this._counts.push(outname);
      continue;
    }

    m = map[mname];
    if (!m) {
      inputVisit(field);
      m = (map[mname] = []);
      m.field = field;
      this._measures.push(m);
    }

    if (op !== 'count') this._countOnly = false;
    m.push(createMeasure(op, outname));
  }

  this._measures = this._measures.map(function(m) {
    return compileMeasures(m, m.field);
  });

  return {}; // aggregation cells (this.value)
};

function measureName(op, mname, as) {
  return as || (op + (!mname ? '' : '_' + mname));
}

// -- Cell Management -----

function cellkey(x) {
  var d = this._dims,
      n = d.length, i,
      k = String(d[0](x));

  for (i=1; i<n; ++i) {
    k += '|' + d[i](x);
  }

  return k;
}

prototype$8.cellkey = cellkey;

prototype$8.cell = function(key, t) {
  var cell = this.value[key];
  if (!cell) {
    cell = this.value[key] = this.newcell(key, t);
    this._adds[this._alen++] = cell;
  } else if (cell.num === 0 && this._drop && cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._adds[this._alen++] = cell;
  } else if (cell.stamp < this.stamp) {
    cell.stamp = this.stamp;
    this._mods[this._mlen++] = cell;
  }
  return cell;
};

prototype$8.newcell = function(key, t) {
  var cell = {
    key:   key,
    num:   0,
    agg:   null,
    tuple: this.newtuple(t, this._prev && this._prev[key]),
    stamp: this.stamp,
    store: false
  };

  if (!this._countOnly) {
    var measures = this._measures,
        n = measures.length, i;

    cell.agg = Array(n);
    for (i=0; i<n; ++i) {
      cell.agg[i] = new measures[i](cell, cell.tuple);
    }
  }

  if (cell.store) {
    cell.data = new TupleStore();
  }

  return cell;
};

prototype$8.newtuple = function(t, p) {
  var names = this._dnames,
      dims = this._dims,
      x = {}, i, n;

  for (i=0, n=dims.length; i<n; ++i) {
    x[names[i]] = dims[i](t);
  }

  return p ? replace(p.tuple, x) : ingest(x);
};

// -- Process Tuples -----

prototype$8.add = function(t) {
  var key = this.cellkey(t),
      cell = this.cell(key, t),
      agg, i, n;

  cell.num += 1;
  if (this._countOnly) return;

  if (cell.store) cell.data.add(t);

  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].add(agg[i].get(t), t);
  }
};

prototype$8.rem = function(t) {
  var key = this.cellkey(t),
      cell = this.cell(key, t),
      agg, i, n;

  cell.num -= 1;
  if (this._countOnly) return;

  if (cell.store) cell.data.rem(t);

  agg = cell.agg;
  for (i=0, n=agg.length; i<n; ++i) {
    agg[i].rem(agg[i].get(t), t);
  }
};

prototype$8.celltuple = function(cell) {
  var tuple = cell.tuple,
      counts = this._counts,
      agg, i, n;

  // consolidate stored values
  if (cell.store) {
    cell.data.values();
  }

  // update tuple properties
  for (i=0, n=counts.length; i<n; ++i) {
    tuple[counts[i]] = cell.num;
  }
  if (!this._countOnly) {
    agg = cell.agg;
    for (i=0, n=agg.length; i<n; ++i) {
      agg[i].set();
    }
  }

  return tuple;
};

prototype$8.changes = function(out) {
  var adds = this._adds,
      mods = this._mods,
      prev = this._prev,
      drop = this._drop,
      add = out.add,
      rem = out.rem,
      mod = out.mod,
      cell, key, i, n;

  if (prev) for (key in prev) {
    rem.push(prev[key].tuple);
  }

  for (i=0, n=this._alen; i<n; ++i) {
    add.push(this.celltuple(adds[i]));
    adds[i] = null; // for garbage collection
  }

  for (i=0, n=this._mlen; i<n; ++i) {
    cell = mods[i];
    (cell.num === 0 && drop ? rem : mod).push(this.celltuple(cell));
    mods[i] = null; // for garbage collection
  }

  this._alen = this._mlen = 0; // reset list of active cells
  this._prev = null;
  return out;
};

/**
 * Generates a binning function for discretizing data.
 * @constructor
 * @param {object} params - The parameters for this operator. The
 *   provided values should be valid options for the {@link bin} function.
 * @param {function(object): *} params.field - The data field to bin.
 */
function Bin(params) {
  Transform.call(this, null, params);
}

var prototype$10 = inherits(Bin, Transform);

prototype$10.transform = function(_, pulse) {
  var bins = this._bins(_),
      step = bins.step,
      as = _.as || ['bin0', 'bin1'],
      b0 = as[0],
      b1 = as[1],
      flag = _.modified() ? (pulse.reflow(), pulse.SOURCE)
        : pulse.modified(accessorFields(_.field)) ? pulse.ADD_MOD
        : pulse.ADD;

  pulse.visit(flag, function(t) {
    t[b1] = (t[b0] = bins(t)) + step;
  });

  return pulse.modifies(as);
};

prototype$10._bins = function(_) {
  if (this.value && !_.modified()) {
    return this.value;
  }

  var field = _.field,
      bins  = bin(_),
      start = bins.start,
      step  = bins.step;

  var f = function(t) {
    var v = field(t);
    return v == null ? null
      : start + step * Math.floor((+v - start) / step);
  };

  f.step = step;

  return this.value = accessor(
    f,
    accessorFields(field),
    _.name || 'bin_' + accessorName(field)
  );
};

/**
 * Collects all data tuples that pass through this operator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for additionally sorting the collected tuples.
 */
function Collect(params) {
  Transform.call(this, [], params);
}

var prototype$11 = inherits(Collect, Transform);

prototype$11.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      add = pulse.changed(pulse.ADD),
      mod = pulse.changed(),
      sort = _.sort,
      data = this.value,
      push = function(t) { data.push(t); },
      n = 0, map;

  if (out.rem.length) { // build id map and filter data array
    map = {};
    out.visit(out.REM, function(t) { map[t._id] = 1; ++n; });
    data = data.filter(function(t) { return !map[t._id]; });
  }

  if (sort) {
    // if sort criteria change, re-sort the full data array
    if (_.modified('sort') || pulse.modified(sort.fields)) {
      data.sort(sort);
      mod = true;
    }
    // if added tuples, sort them in place and then merge
    if (add) {
      data = merge$1(sort, data, out.add.sort(sort));
    }
  } else if (add) {
    // no sort, so simply add new tuples
    out.visit(out.ADD, push);
  }

  this.modified(mod);
  this.value = out.source = data;
  return out;
};

/**
 * Generates a comparator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string>} params.fields - The fields to compare.
 * @param {Array<string>} [params.orders] - The sort orders.
 *   Each entry should be one of "ascending" (default) or "descending".
 */
function Compare(params) {
  Operator.call(this, null, update$1, params);
}

inherits(Compare, Operator);

function update$1(_) {
  return (this.value && !_.modified())
    ? this.value
    : compare(_.fields, _.orders);
}

/**
 * Count regexp-defined pattern occurrences in a text field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the text field.
 * @param {string} [params.pattern] - RegExp string defining the text pattern.
 * @param {string} [params.case] - One of 'lower', 'upper' or null (mixed) case.
 * @param {string} [params.stopwords] - RegExp string of words to ignore.
 */
function CountPattern(params) {
  Transform.call(this, null, params);
}

function tokenize(text, tcase, match) {
  switch (tcase) {
    case 'upper': text = text.toUpperCase(); break;
    case 'lower': text = text.toLowerCase(); break;
  }
  return text.match(match);
}

var prototype$12 = inherits(CountPattern, Transform);

prototype$12.transform = function(_, pulse) {
  function process(update) {
    return function(tuple) {
      var tokens = tokenize(get(tuple), _.case, match) || [], t;
      for (var i=0, n=tokens.length; i<n; ++i) {
        if (!stop.test(t = tokens[i])) update(t);
      }
    };
  }

  var init = this._parameterCheck(_, pulse),
      counts = this._counts,
      match = this._match,
      stop = this._stop,
      get = _.field,
      as = _.as || ['text', 'count'],
      add = process(function(t) { counts[t] = 1 + (counts[t] || 0); }),
      rem = process(function(t) { counts[t] -= 1; });

  if (init) {
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);
    pulse.visit(pulse.REM, rem);
  }

  return this._finish(pulse, as); // generate output tuples
};

prototype$12._parameterCheck = function(_, pulse) {
  var init = false;

  if (_.modified('stopwords') || !this._stop) {
    this._stop = new RegExp('^' + (_.stopwords || '') + '$', 'i');
    init = true;
  }

  if (_.modified('pattern') || !this._match) {
    this._match = new RegExp((_.pattern || '[\\w\']+'), 'g');
    init = true;
  }

  if (_.modified('field') || pulse.modified(_.field.fields)) {
    init = true;
  }

  if (init) this._counts = {};
  return init;
}

prototype$12._finish = function(pulse, as) {
  var counts = this._counts,
      tuples = this._tuples || (this._tuples = {}),
      text = as[0],
      count = as[1],
      out = pulse.fork(),
      w, t, c;

  for (w in counts) {
    t = tuples[w];
    c = counts[w] || 0;
    if (!t && c) {
      tuples[w] = (t = ingest({}));
      t[text] = w;
      t[count] = c;
      out.add.push(t);
    } else if (c === 0) {
      if (t) out.rem.push(t);
      counts[w] = null;
      tuples[w] = null;
    } else if (t[count] !== c) {
      t[count] = c;
      out.mod.push(t);
    }
  }

  return out.modifies(as);
};

/**
 * Perform a cross-product of a tuple stream with itself.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object):boolean} [params.filter] - An optional filter
 *   function for selectively including tuples in the cross product.
 * @param {Array<string>} [params.as] - The names of the output fields.
 */
function Cross(params) {
  Transform.call(this, null, params);
}

var prototype$13 = inherits(Cross, Transform);

prototype$13.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE),
      data = this.value,
      as = _.as || ['a', 'b'],
      a = as[0], b = as[1],
      reset = !data
          || pulse.changed(pulse.ADD_REM)
          || _.modified('as')
          || _.modified('filter');

  if (reset) {
    if (data) out.rem = data;
    out.add = this.value = cross(pulse.source, a, b, _.filter || truthy);
  } else {
    out.mod = data;
  }

  return out.source = this.value, out.modifies(as);
};

function cross(input, a, b, filter) {
  var data = [],
      t = {},
      n = input.length,
      i = 0,
      j, left;

  for (; i<n; ++i) {
    t[a] = left = input[i];
    for (j=0; j<n; ++j) {
      t[b] = input[j];
      if (filter(t)) {
        data.push(ingest(t));
        t = {};
        t[a] = left;
      }
    }
  }

  return data;
}

var Distributions = {
  kde:     randomKDE,
  mixture: randomMixture,
  normal:  randomNormal,
  uniform: randomUniform
};

var DISTRIBUTIONS = 'distributions';
var FUNCTION = 'function';
var FIELD = 'field';
/**
 * Parse a parameter object for a probability distribution.
 * @param {object} def - The distribution parameter object.
 * @param {function():Array<object>} - A method for requesting
 *   source data. Used for distributions (such as KDE) that
 *   require sample data points. This method will only be
 *   invoked if the 'from' parameter for a target data source
 *   is not provided. Typically this method returns backing
 *   source data for a Pulse object.
 * @return {object} - The output distribution object.
 */
function parse$1(def, data) {
  var func = def[FUNCTION];
  if (!Distributions.hasOwnProperty(func)) {
    error('Unknown distribution function: ' + func);
  }

  var d = Distributions[func]();

  for (var name in def) {
    // if data field, extract values
    if (name === FIELD) {
      d.data((def.from || data()).map(def[name]));
    }

    // if distribution mixture, recurse to parse each definition
    else if (name === DISTRIBUTIONS) {
      d[name](def[name].map(function(_) { return parse$1(_, data); }));
    }

    // otherwise, simply set the parameter
    else if (typeof d[name] === FUNCTION) {
      d[name](def[name]);
    }
  }

  return d;
}

/**
 * Grid sample points for a probability density. Given a distribution and
 * a sampling extent, will generate points suitable for plotting either
 * PDF (probability density function) or CDF (cumulative distribution
 * function) curves.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.distribution - The probability distribution. This
 *   is an object parameter dependent on the distribution type.
 * @param {string} [params.method='pdf'] - The distribution method to sample.
 *   One of 'pdf' or 'cdf'.
 * @param {Array<number>} [params.extent] - The [min, max] extent over which
 *   to sample the distribution. This argument is required in most cases, but
 *   can be omitted if the distribution (e.g., 'kde') supports a 'data' method
 *   that returns numerical sample points from which the extent can be deduced.
 * @param {number} [params.steps=100] - The number of sampling steps.
 */
function Density(params) {
  Transform.call(this, null, params);
}

var prototype$14 = inherits(Density, Transform);

prototype$14.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);

  if (!this.value || pulse.changed() || _.modified()) {
    var dist = parse$1(_.distribution, source(pulse)),
        method = _.method || 'pdf';

    if (method !== 'pdf' && method !== 'cdf') {
      error('Invalid density method: ' + method);
    }
    if (!_.extent && !dist.data) {
      error('Missing density extent parameter.');
    }
    method = dist[method];

    var as = _.as || ['value', 'density'],
        domain = _.extent || extent(dist.data()),
        step = (domain[1] - domain[0]) / (_.steps || 100),
        values = range(domain[0], domain[1] + step/2, step)
          .map(function(v) {
            var tuple = {};
            tuple[as[0]] = v;
            tuple[as[1]] = method(v);
            return ingest(tuple);
          });

    if (this.value) out.rem = this.value;
    this.value = out.add = out.source = values;
  }

  return out;
};

function source(pulse) {
  return function() { return pulse.materialize(pulse.SOURCE).source; };
}

/**
 * Computes extents (min/max) for a data field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field over which to compute extends.
 */
function Extent(params) {
  Transform.call(this, [+Infinity, -Infinity], params);
}

var prototype$15 = inherits(Extent, Transform);

prototype$15.transform = function(_, pulse) {
  var extent = this.value,
      field = _.field,
      min = extent[0],
      max = extent[1],
      flag = pulse.ADD,
      mod;

  mod = pulse.changed()
     || pulse.modified(field.fields)
     || _.modified('field');

  if (mod) {
    flag = pulse.SOURCE;
    min = +Infinity;
    max = -Infinity;
  }

  pulse.visit(flag, function(t) {
    var v = field(t);
    if (v < min) min = v;
    if (v > max) max = v;
  });

  this.value = [min, max];
};

/**
 * Provides a bridge between a parent transform and a target subflow that
 * consumes only a subset of the tuples that pass through the parent.
 * @constructor
 * @param {Pulse} pulse - A pulse to use as the value of this operator.
 * @param {Transform} parent - The parent transform (typically a Facet instance).
 * @param {Transform} target - A transform that receives the subflow of tuples.
 */
function Subflow(pulse, parent) {
  Operator.call(this, pulse);
  this.parent = parent;
}

var prototype$17 = inherits(Subflow, Operator);

prototype$17.connect = function(target) {
  this.targets().add(target);
  return (target.source = this);
};

/**
 * Add an 'add' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being added.
 */
prototype$17.add = function(t) {
  this.value.add.push(t);
};

/**
 * Add a 'rem' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being removed.
 */
prototype$17.rem = function(t) {
  this.value.rem.push(t);
};

/**
 * Add a 'mod' tuple to the subflow pulse.
 * @param {Tuple} t - The tuple being modified.
 */
prototype$17.mod = function(t) {
  this.value.mod.push(t);
};

/**
 * Re-initialize this operator's pulse value.
 * @param {Pulse} pulse - The pulse to copy from.
 * @see Pulse.init
 */
prototype$17.init = function(pulse) {
  this.value.init(pulse);
};

/**
 * Evaluate this operator. This method overrides the
 * default behavior to simply return the contained pulse value.
 * @return {Pulse}
 */
prototype$17.evaluate = function() {
  // assert: this.value.stamp === pulse.stamp
  return this.value;
};

/**
 * Facets a dataflow into a set of subflows based on a key.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Dataflow, string): Operator} params.subflow - A function
 *   that generates a subflow of operators and returns its root operator.
 * @param {function(object): *} params.key - The key field to facet by.
 */
function Facet(params) {
  Transform.call(this, {}, params);
  this._keys = {}; // cache previously calculated key values
  this._count = 0; // count of subflows

  // keep track of active subflows, use as targets array for listeners
  // this allows us to limit propagation to only updated subflows
  var a = this._targets = [];
  a.active = 0;
  a.forEach = function(f) {
    for (var i=0, n=a.active; i<n; ++i) f(a[i], i, a);
  };
}

var prototype$16 = inherits(Facet, Transform);

prototype$16.activate = function(flow) {
  this._targets[this._targets.active++] = flow;
};

prototype$16.subflow = function(key, flow, pulse, parent) {
  var flows = this.value,
      sf = flows.hasOwnProperty(key) && flows[key],
      df, p;

  if (!sf) {
    p = parent || (p = this._group[key]) && p.tuple;
    df = pulse.dataflow;
    sf = df.add(new Subflow(pulse.fork(), this))
      .connect(flow(df, key, this._count++, p));
    flows[key] = sf;
    this.activate(sf);
  } else if (sf.value.stamp < pulse.stamp) {
    sf.init(pulse);
    this.activate(sf);
  }

  return sf;
};

prototype$16.transform = function(_, pulse) {
  var self = this,
      key = _.key,
      flow = _.subflow,
      cache = this._keys,
      rekey = _.modified('key');

  function subflow(key) {
    return self.subflow(key, flow, pulse);
  }

  this._group = _.group || {};
  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.ADD, function(t) {
    subflow(cache[t._id] = key(t)).add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    var k = cache[t._id];
    cache[t._id] = null;
    subflow(k).rem(t);
  });

  if (rekey || pulse.modified(key.fields)) {
    pulse.visit(pulse.MOD, function(t) {
      var k0 = cache[t._id],
          k1 = key(t);
      if (k0 === k1) {
        subflow(k1).mod(t);
      } else {
        cache[t._id] = k1;
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  } else if (pulse.changed(pulse.MOD)) {
    pulse.visit(pulse.MOD, function(t) {
      subflow(cache[t._id]).mod(t);
    });
  }

  if (rekey) {
    pulse.visit(pulse.REFLOW, function(t) {
      var k0 = cache[t._id],
          k1 = key(t);
      if (k0 !== k1) {
        cache[t._id] = k1;
        subflow(k0).rem(t);
        subflow(k1).add(t);
      }
    });
  }

  return pulse;
};

/**
 * Generates one or more field accessor functions.
 * If the 'name' parameter is an array, an array of field accessors
 * will be created and the 'as' parameter will be ignored.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {string} params.name - The field name(s) to access.
 * @param {string} params.as - The accessor function name.
 */
function Field(params) {
  Operator.call(this, null, update$2, params);
}

inherits(Field, Operator);

function update$2(_) {
  return (this.value && !_.modified()) ? this.value
    : isArray(_.name) ? array$1(_.name).map(function(f) { return field(f); })
    : field(_.name, _.as);
}

/**
 * Filters data tuples according to a predicate function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The predicate expression function
 *   that determines a tuple's filter status. Truthy values pass the filter.
 */
function Filter(params) {
  Transform.call(this, {}, params);
}

var prototype$18 = inherits(Filter, Transform);

prototype$18.transform = function(_, pulse) {
  var test = _.expr,
      cache = this.value, // cache ids of filtered tuples
      output = pulse.fork(),
      add = output.add,
      rem = output.rem,
      mod = output.mod, isMod = true;

  pulse.visit(pulse.REM, function(x) {
    if (!cache[x._id]) rem.push(x);
    else cache[x._id] = 0;
  });

  pulse.visit(pulse.ADD, function(x) {
    if (test(x, _)) add.push(x);
    else cache[x._id] = 1;
  });

  function revisit(x) {
    var b = test(x, _),
        s = cache[x._id];
    if (b && s) {
      cache[x._id] = 0;
      add.push(x);
    } else if (!b && !s) {
      cache[x._id] = 1;
      rem.push(x);
    } else if (isMod && b && !s) {
      mod.push(x);
    }
  }

  pulse.visit(pulse.MOD, revisit);

  if (_.modified()) {
    isMod = false;
    pulse.visit(pulse.REFLOW, revisit);
  }

  return output;
};

/**
 * Folds one more tuple fields into multiple tuples in which the field
 * name and values are available under new 'key' and 'value' fields.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.fields - An array of field accessors
 *   for the tuple fields that should be folded.
 */
function Fold(params) {
  Transform.call(this, {}, params);
}

var prototype$19 = inherits(Fold, Transform);

function keyFunction(f) {
  return f.fields.join('|');
}

prototype$19.transform = function(_, pulse) {
  var cache = this.value,
      reset = _.modified('fields'),
      fields = _.fields,
      as = _.as || ['key', 'value'],
      key = as[0],
      value = as[1],
      keys = fields.map(keyFunction),
      n = fields.length,
      stamp = pulse.stamp,
      out = pulse.fork(),
      i = 0, mask = 0, id;

  function add(t) {
    var f = (cache[t._id] = Array(n)); // create cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, derive folds
      ft = (f[i] = derive(t));
      ft[key] = keys[i];
      ft[value] = fields[i](t);
      out.add.push(ft);
    }
  }

  function mod(t) {
    var f = cache[t._id]; // get cache of folded tuples
    for (var i=0, ft; i<n; ++i) { // for each key, rederive folds
      if (!(mask & (1 << i))) continue; // field is unchanged
      ft = rederive(t, f[i], stamp);
      ft[key] = keys[i];
      ft[value] = fields[i](t);
      out.mod.push(ft);
    }
  }

  if (reset) {
    // on reset, remove all folded tuples and clear cache
    for (id in cache) out.rem.push.apply(out.rem, cache[id]);
    cache = this.value = {};
    pulse.visit(pulse.SOURCE, add);
  } else {
    pulse.visit(pulse.ADD, add);

    for (; i<n; ++i) {
      if (pulse.modified(fields[i].fields)) mask |= (1 << i);
    }
    if (mask) pulse.visit(pulse.MOD, mod);

    pulse.visit(pulse.REM, function(t) {
      out.rem.push.apply(out.rem, cache[t._id]);
      cache[t._id] = null;
    });
  }

  return out.modifies(as);
};

/**
 * Invokes a function for each data tuple and saves the results as a new field.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.expr - The formula function to invoke for each tuple.
 * @param {string} params.as - The field name under which to save the result.
 */
function Formula(params) {
  Transform.call(this, null, params);
}

var prototype$20 = inherits(Formula, Transform);

prototype$20.transform = function(_, pulse) {
  var func = _.expr,
      as = _.as,
      mod;

  function set(t) {
    t[as] = func(t, _);
  }

  if (_.modified()) {
    // parameters updated, need to reflow
    pulse.materialize().reflow().visit(pulse.SOURCE, set);
  } else {
    mod = pulse.modified(func.fields);
    pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
  }

  return pulse.modifies(as);
};

/**
 * Generates data tuples using a provided generator function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Parameters): object} params.generator - A tuple generator
 *   function. This function is given the operator parameters as input.
 *   Changes to any additional parameters will not trigger re-calculation
 *   of previously generated tuples. Only future tuples are affected.
 * @param {number} params.size - The number of tuples to produce.
 */
function Generate(params) {
  Transform.call(this, [], params);
}

var prototype$21 = inherits(Generate, Transform);

prototype$21.transform = function(_, pulse) {
  var data = this.value,
      out = pulse.fork(pulse.ALL),
      num = _.size - data.length,
      gen = _.generator,
      add, rem, t;

  if (num > 0) {
    // need more tuples, generate and add
    for (add=[]; --num >= 0;) {
      add.push(t = ingest(gen(_)));
      data.push(t);
    }
    out.add = out.add.length
      ? out.materialize(out.ADD).add.concat(add)
      : add;
  } else {
    // need fewer tuples, remove
    rem = data.slice(0, -num);
    out.rem = out.rem.length
      ? out.materialize(out.REM).rem.concat(rem)
      : rem;
    data = data.slice(-num);
  }

  out.source = this.value = data;
  return out;
};

var Methods = {
  value: 'value',
  median: median,
  mean: mean,
  min: min,
  max: max
};

var Empty = [];

/**
 * Impute missing values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to impute.
 * @param {Array<function(object): *>} [params.groupby] - An array of
 *   accessors to determine series within which to perform imputation.
 * @param {Array<function(object): *>} [params.orderby] - An array of
 *   accessors to determine the ordering within a series.
 * @param {string} [method='value'] - The imputation method to use. One of
 *   'value', 'mean', 'median', 'max', 'min'.
 * @param {*} [value=0] - The constant value to use for imputation
 *   when using method 'value'.
 */
function Impute(params) {
  Transform.call(this, [], params);
}

var prototype$22 = inherits(Impute, Transform);

function getValue(_) {
  var m = _.method || Methods.value, v;

  if (Methods[m] == null) {
    error('Unrecognized imputation method: ' + m);
  } else if (m === Methods.value) {
    v = _.value !== undefined ? _.value : 0;
    return function() { return v; };
  } else {
    return Methods[m];
  }
}

function getField(_) {
  var f = _.field;
  return function(t) { return t ? f(t) : NaN; };
}

prototype$22.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      impute = getValue(_),
      field = getField(_),
      fName = accessorName(_.field),
      gNames = _.groupby.map(accessorName),
      oNames = _.orderby.map(accessorName),
      groups = partition(pulse.source, _.groupby, _.orderby),
      curr = [],
      prev = this.value,
      m = groups.domain.length,
      group, value, gVals, oVals, g, i, j, l, n, t;

  for (g=0, l=groups.length; g<l; ++g) {
    group = groups[g];
    gVals = group.values;
    value = NaN;

    // add tuples for missing values
    for (j=0; j<m; ++j) {
      if (group[j] != null) continue;
      oVals = groups.domain[j];

      t = {_impute: true};
      for (i=0, n=gVals.length; i<n; ++i) t[gNames[i]] = gVals[i];
      for (i=0, n=oVals.length; i<n; ++i) t[oNames[i]] = oVals[i];
      t[fName] = isNaN(value) ? (value = impute(group, field)) : value;

      curr.push(ingest(t));
    }
  }

  // update pulse with imputed tuples
  if (curr.length) out.add = out.materialize(out.ADD).add.concat(curr);
  if (prev.length) out.rem = out.materialize(out.REM).rem.concat(prev);
  this.value = curr;

  return out;
};

function partition(data, groupby, orderby) {
  var get = function(f) { return f(t); },
      groups = [],
      domain = [],
      oMap = {}, oVals, oKey,
      gMap = {}, gVals, gKey,
      group, i, j, n, t;

  for (i=0, n=data.length; i<n; ++i) {
    t = data[i];

    oKey = (oVals = orderby.map(get)) + '';
    j = oMap[oKey] || (oMap[oKey] = domain.push(oVals));

    gKey = (gVals = groupby ? groupby.map(get) : Empty) + '';
    if (!(group = gMap[gKey])) {
      group = (gMap[gKey] = []);
      groups.push(group);
      group.values = gVals;
    }
    group[j-1] = t;
  }

  return (groups.domain = domain, groups);
}

/**
 * Generates a key function.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<string>} params.fields - The field name(s) for the key function.
 */
function Key(params) {
  Operator.call(this, null, update$3, params);
}

inherits(Key, Operator);

function update$3(_) {
  return (this.value && !_.modified()) ? this.value : key(_.fields);
}

/**
 * Extend tuples by joining them with values from a lookup table.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Map} params.index - The lookup table map.
 * @param {Array<function(object): *} params.fields - The fields to lookup.
 * @param {Array<string>} params.as - Output field names for each lookup value.
 * @param {*} [params.default] - A default value to use if lookup fails.
 */
function Lookup(params) {
  Transform.call(this, {}, params);
}

var prototype$23 = inherits(Lookup, Transform);

function get$1(index, key) {
  return index.hasOwnProperty(key) ? index[key] : null;
}

prototype$23.transform = function(_, pulse) {
  var out = pulse,
      as = _.as,
      keys = _.fields,
      index = _.index,
      defaultValue = _.default==null ? null : _.default,
      reset = _.modified(),
      flag = pulse.ADD,
      set, key, field, mods;

  if (keys.length === 1) {
    key = keys[0];
    field = as[0];
    set = function(t) {
      var v = get$1(index, key(t));
      t[field] = v==null ? defaultValue : v;
    };
  } else {
    set = function(t) {
      for (var i=0, n=keys.length, v; i<n; ++i) {
        v = get$1(index, keys[i](t));
        t[as[i]] = v==null ? defaultValue : v;
      }
    };
  }

  if (reset) {
    flag = pulse.SOURCE;
    out = pulse.fork(pulse.ALL).reflow();
  } else {
    mods = keys.some(function(k) { return pulse.modified(k.fields); });
    flag |= (mods ? pulse.MOD : 0);
  }
  pulse.visit(flag, set);

  return out.modifies(as);
};

/**
 * Computes global min/max extents over a collection of extents.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<Array<number>>} params.extents - The input extents.
 */
function MultiExtent(params) {
  Operator.call(this, null, update$4, params);
}

inherits(MultiExtent, Operator);

function update$4(_) {
  if (this.value && !_.modified()) {
    return this.value;
  }

  var min = +Infinity,
      max = -Infinity,
      ext = _.extents,
      i, n, e;

  for (i=0, n=ext.length; i<n; ++i) {
    e = ext[i];
    if (e[0] < min) min = e[0];
    if (e[1] > max) max = e[1];
  }
  return [min, max];
}

/**
 * Merge a collection of value arrays.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<Array<*>>} params.values - The input value arrrays.
 */
function MultiValues(params) {
  Operator.call(this, null, update$5, params);
}

inherits(MultiValues, Operator);

function update$5(_) {
  return (this.value && !_.modified())
    ? this.value
    : _.values.reduce(function(data, _) { return data.concat(_); }, []);
}

/**
 * Operator whose value is simply its parameter hash. This operator is
 * useful for enabling reactive updates to values of nested objects.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Params(params) {
  Transform.call(this, null, params);
}

inherits(Params, Transform);

Params.prototype.transform = function(_, pulse) {
  this.modified(_.modified());
  this.value = _;
  return pulse.fork(); // do not pass tuples
};

/**
 * Partitions pre-faceted data into tuple subflows.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(Dataflow, string): Operator} params.subflow - A function
 *   that generates a subflow of operators and returns its root operator.
 * @param {function(object): Array<object>} params.field - The field
 *   accessor for an array of subflow tuple objects.
 */
function PreFacet(params) {
  Facet.call(this, params);
}

var prototype$24 = inherits(PreFacet, Facet);

prototype$24.transform = function(_, pulse) {
  var self = this,
      flow = _.subflow,
      field = _.field;

  if (_.modified('field') || field && pulse.modified(field.fields)) {
    error('PreFacet does not support field modification.');
  }

  this._targets.active = 0; // reset list of active subflows

  pulse.visit(pulse.ADD, function(t) {
    var sf = self.subflow(t._id, flow, pulse, t);
    field ? field(t).forEach(function(_) { sf.add(ingest(_)); }) : sf.add(t);
  });

  pulse.visit(pulse.REM, function(t) {
    var sf = self.subflow(t._id, flow, pulse, t);
    field ? field(t).forEach(function(_) { sf.rem(_); }) : sf.rem(t);
  });

  return pulse;
};

/**
 * Generates data tuples for a specified range of numbers.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} params.start - The first number in the range.
 * @param {number} params.stop - The last number (exclusive) in the range.
 * @param {number} [params.step=1] - The step size between numbers in the range.
 */
function Range(params) {
  Transform.call(this, [], params);
}

var prototype$25 = inherits(Range, Transform);

prototype$25.transform = function(_, pulse) {
  if (!_.modified()) return;

  var out = pulse.materialize().fork(pulse.MOD);

  out.rem = pulse.rem.concat(this.value);
  out.source = this.value = range(_.start, _.stop, _.step).map(ingest);
  out.add = pulse.add.concat(this.value);

  return out;
};

/**
 * Compute rank order scores for tuples. The tuples are assumed to have been
 * sorted in the desired rank order by an upstream data source.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - An accessor for the field to rank.
 * @param {boolean} params.normalize - Boolean flag for normalizing rank values.
 *   If true, the integer rank scores are normalized to range [0, 1].
 */
function Rank(params) {
  Transform.call(this, null, params);
}

var prototype$26 = inherits(Rank, Transform);

prototype$26.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Rank transform requires an upstream data source.');
  }

  var norm  = _.normalize,
      field = _.field,
      as = _.as || 'rank',
      ranks = {},
      n = -1, rank;

  if (field) {
    // If we have a field accessor, first compile distinct keys.
    pulse.visit(pulse.SOURCE, function(t) {
      var v = field(t);
      if (ranks[v] == null) ranks[v] = ++n;
    });
    pulse.visit(pulse.SOURCE, norm && --n
      ? function(t) { t[as] = ranks[field(t)] / n; }
      : function(t) { t[as] = ranks[field(t)]; }
    );
  } else {
    n += pulse.source.length;
    rank = -1;
    // Otherwise rank all the tuples together.
    pulse.visit(pulse.SOURCE, norm && n
      ? function(t) { t[as] = ++rank / n; }
      : function(t) { t[as] = ++rank; }
    );
  }

  return pulse.reflow().modifies(as);
};

/**
 * Relays a data stream between data processing pipelines.
 * If the derive parameter is set, this transform will create derived
 * copies of observed tuples. This provides derived data streams in which
 * modifications to the tuples do not pollute an upstream data source.
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.derive=false] - Boolean flag indicating if
 *   the transform should make derived copies of incoming tuples.
 * @constructor
 */
function Relay(params) {
  Transform.call(this, null, params);
}

var prototype$27 = inherits(Relay, Transform);

prototype$27.transform = function(_, pulse) {
  var out,
      lut = this.value || (out = pulse = pulse.addAll(), this.value = {});

  if (_.derive) {
    out = pulse.fork();

    pulse.visit(pulse.ADD, function(t) {
      var dt = derive(t);
      lut[t._id] = dt;
      out.add.push(dt);
    });

    pulse.visit(pulse.MOD, function(t) {
      out.mod.push(rederive(t, lut[t._id]));
    });

    pulse.visit(pulse.REM, function(t) {
      out.rem.push(lut[t._id]);
      lut[t._id] = null;
    });
  }

  return out;
};

/**
 * Samples tuples passing through this operator.
 * Uses reservoir sampling to maintain a representative sample.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {number} [params.size=1000] - The maximum number of samples.
 */
function Sample(params) {
  Transform.call(this, [], params);
  this.count = 0;
}

var prototype$28 = inherits(Sample, Transform);

prototype$28.transform = function(_, pulse) {
  var out = pulse.fork(),
      mod = _.modified('size'),
      num = _.size,
      res = this.value,
      cnt = this.count,
      cap = 0,
      map = res.reduce(function(m, t) { return (m[t._id] = 1, m); }, {});

  // sample reservoir update function
  function update(t) {
    var p, idx;

    if (res.length < num) {
      res.push(t);
    } else {
      idx = ~~(cnt * Math.random());
      if (idx < res.length && idx >= cap) {
        p = res[idx];
        if (map[p._id]) out.rem.push(p); // eviction
        res[idx] = t;
      }
    }
    ++cnt;
  }

  if (pulse.rem.length) {
    // find all tuples that should be removed, add to output
    pulse.visit(pulse.REM, function(t) {
      if (map[t._id]) {
        map[t._id] = -1;
        out.rem.push(t);
      }
      --cnt;
    });

    // filter removed tuples out of the sample reservoir
    res = res.filter(function(t) { return map[t._id] !== -1; });
  }

  if ((pulse.rem.length || mod) && res.length < num && pulse.source) {
    // replenish sample if backing data source is available
    cap = cnt = res.length;
    pulse.visit(pulse.SOURCE, function(t) {
      // update, but skip previously sampled tuples
      if (!map[t._id]) update(t);
    });
    cap = -1;
  }

  if (mod && res.length > num) {
    for (var i=0, n=res.length-num; i<n; ++i) {
      map[res[i]._id] = -1;
      out.rem.push(res[i]);
    }
    res = res.slice(n);
  }

  if (pulse.mod.length) {
    // propagate modified tuples in the sample reservoir
    pulse.visit(pulse.MOD, function(t) {
      if (map[t._id]) out.mod.push(t);
    });
  }

  if (pulse.add.length) {
    // update sample reservoir
    pulse.visit(pulse.ADD, update);
  }

  if (pulse.add.length || cap < 0) {
    // output newly added tuples
    out.add = res.filter(function(t) { return !map[t._id]; });
  }

  this.count = cnt;
  this.value = out.source = res;
  return out;
};

/**
 * Propagates a new pulse without any tuples so long as the input
 * pulse contains some added, removed or modified tuples.
 * @constructor
 */
function Sieve(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$29 = inherits(Sieve, Transform);

prototype$29.transform = function(_, pulse) {
  this.value = pulse.source;
  return pulse.changed()
    ? pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS)
    : pulse.StopPropagation;
};

/**
 * An index that maps from unique, string-coerced, field values to tuples.
 * Assumes that the field serves as a unique key with no duplicate values.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The field accessor to index.
 */
function TupleIndex(params) {
  Transform.call(this, {}, params);
}

var prototype$30 = inherits(TupleIndex, Transform);

prototype$30.transform = function(_, pulse) {
  var field = _.field,
      index = this.value,
      mod = true;

  function set(t) { index[field(t)] = t; }

  if (_.modified('field') || pulse.modified(field.fields)) {
    this.value = index = {};
    pulse.visit(pulse.SOURCE, set);
  } else if (pulse.changed()) {
    pulse.visit(pulse.REM, function(t) { index[field(t)] = undefined; });
    pulse.visit(pulse.ADD, set);
  } else {
    mod = false;
  }

  this.modified(mod);
  return pulse.fork();
};

/**
 * Extracts an array of values. Assumes the source data has already been
 * reduced as needed (e.g., by an upstream Aggregate transform).
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The domain field to extract.
 * @param {function(*,*): number} [params.sort] - An optional
 *   comparator function for sorting the values. The comparator will be
 *   applied to backing tuples prior to value extraction.
 */
function Values(params) {
  Transform.call(this, null, params);
}

var prototype$31 = inherits(Values, Transform);

prototype$31.transform = function(_, pulse) {
  var run = !this.value
    || _.modified('field')
    || _.modified('sort')
    || pulse.changed()
    || (_.sort && pulse.modified(_.sort.fields));

  if (run) {
    this.value = (_.sort
      ? pulse.source.slice().sort(_.sort)
      : pulse.source).map(_.field);
  }
};

var AggregateDefinition = {
  "type": "Aggregate",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "groupby", "type": "field", "array": true },
    { "name": "fields", "type": "field", "array": true },
    { "name": "ops", "type": "enum", "array": true,
      "values": [
        "count", "valid", "missing", "distinct",
        "sum", "mean", "average", "variance", "variancep", "stdev",
        "stdevp", "median", "q1", "q3", "modeskew", "min", "max",
        "argmin", "argmax" ] },
    { "name": "as", "type": "string", "array": true },
    { "name": "drop", "type": "boolean", "default": true },
    { "name": "key", "type": "field" }
  ]
};

var BinDefinition = {
  "type": "Bin",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "maxbins", "type": "number", "default": 20 },
    { "name": "base", "type": "number", "default": 10 },
    { "name": "divide", "type": "number", "array": true, "default": [5, 2] },
    { "name": "extent", "type": "number", "array": true, "length": 2, "required": true },
    { "name": "step", "type": "number" },
    { "name": "steps", "type": "number", "array": true },
    { "name": "minstep", "type": "number", "default": 0 },
    { "name": "nice", "type": "boolean", "default": true },
    { "name": "name", "type": "string" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["bin0", "bin1"] }
  ]
};

var CollectDefinition = {
  "type": "Collect",
  "metadata": {"source": true},
  "params": [
    { "name": "sort", "type": "compare" }
  ]
};

var CountPatternDefinition = {
  "type": "CountPattern",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "case", "type": "enum", "values": ["upper", "lower", "mixed"], "default": "mixed" },
    { "name": "pattern", "type": "string", "default": "[\\w\"]+" },
    { "name": "stopwords", "type": "string", "default": "" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["text", "count"] }
  ]
};

var CrossDefinition = {
  "type": "Cross",
  "metadata": {"source": true, "generates": true, "changes": true},
  "params": [
    { "name": "filter", "type": "expr" },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["a", "b"] }
  ]
};

var distributions = [
  {
    "key": {"function": "normal"},
    "params": [
      { "name": "mean", "type": "number", "default": 0 },
      { "name": "stdev", "type": "number", "default": 1 }
    ]
  },
  {
    "key": {"function": "uniform"},
    "params": [
      { "name": "min", "type": "number", "default": 0 },
      { "name": "max", "type": "number", "default": 1 }
    ]
  },
  {
    "key": {"function": "kde"},
    "params": [
      { "name": "field", "type": "field", "required": true },
      { "name": "from", "type": "data" },
      { "name": "bandwidth", "type": "number", "default": 0 }
    ]
  }
];

var mixture = {
  "key": {"function": "mixture"},
  "params": [
    { "name": "distributions", "type": "param", "array": true,
      "params": distributions },
    { "name": "weights", "type": "number", "array": true }
  ]
};

var DensityDefinition = {
  "type": "Density",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "extent", "type": "number", "array": true, "length": 2 },
    { "name": "steps", "type": "number", "default": 100 },
    { "name": "method", "type": "string", "default": "pdf",
      "values": ["pdf", "cdf"] },
    { "name": "distribution", "type": "param",
      "params": distributions.concat(mixture) },
    { "name": "as", "type": "string", "array": true }
  ]
};

var ExtentDefinition = {
  "type": "Extent",
  "metadata": {},
  "params": [
    { "name": "field", "type": "field", "required": true }
  ]
};

var FilterDefinition = {
  "type": "Filter",
  "metadata": {"changes": true},
  "params": [
    { "name": "expr", "type": "expr", "required": true }
  ]
};

var FoldDefinition = {
  "type": "Fold",
  "metadata": {"generates": true, "changes": true},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["key", "value"] }
  ]
};

var FormulaDefinition = {
  "type": "Formula",
  "metadata": {"modifies": true},
  "params": [
    { "name": "expr", "type": "expr", "required": true },
    { "name": "as", "type": "string", "required": true }
  ]
};

var ImputeDefinition = {
  "type": "Impute",
  "metadata": {"changes": true},
  "params": [
    { "name": "field", "type": "field", "required": true },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "orderby", "type": "field", "array": true },
    { "name": "method", "type": "enum", "default": "value",
      "values": ["value", "mean", "median", "max", "min"] },
    { "name": "value", "default": 0 }
  ]
};

var LookupDefinition = {
  "type": "Lookup",
  "metadata": {"modifies": true},
  "params": [
    { "name": "index", "type": "index", "params": [
        {"name": "from", "type": "data", "required": true },
        {"name": "key", "type": "field", "required": true }
      ] },
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "as", "type": "string", "array": true, "required": true },
    { "name": "default", "default": null }
  ]
};

var RangeDefinition = {
  "type": "Range",
  "metadata": {"generates": true, "source": true},
  "params": [
    { "name": "start", "type": "number", "required": true },
    { "name": "stop", "type": "number", "required": true },
    { "name": "step", "type": "number", "default": 1 }
  ],
  "output": ["value"]
};

var RankDefinition = {
  "type": "Rank",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "normalize", "type": "boolean", "default": false },
    { "name": "as", "type": "string", "default": "rank" }
  ]
};

var SampleDefinition = {
  "type": "Sample",
  "metadata": {"source": true, "changes": true},
  "params": [
    { "name": "size", "type": "number", "default": 1000 }
  ]
};

// Data Transforms
register(AggregateDefinition, Aggregate);
register(BinDefinition, Bin);
register(CollectDefinition, Collect);
register(CountPatternDefinition, CountPattern);
register(CrossDefinition, Cross);
register(DensityDefinition, Density);
register(ExtentDefinition, Extent);
register(FilterDefinition, Filter);
register(FoldDefinition, Fold);
register(FormulaDefinition, Formula);
register(ImputeDefinition, Impute);
register(LookupDefinition, Lookup);
register(RangeDefinition, Range);
register(RankDefinition, Rank);
register(SampleDefinition, Sample);

transform('Compare', Compare);
transform('Facet', Facet);
transform('Field', Field);
transform('Generate', Generate);
transform('Key', Key);
transform('MultiExtent', MultiExtent);
transform('MultiValues', MultiValues);
transform('Params', Params);
transform('PreFacet', PreFacet);
transform('Relay', Relay);
transform('Sieve', Sieve);
transform('Subflow', Subflow);
transform('TupleIndex', TupleIndex);
transform('Values', Values);

var array$2 = Array.prototype;

var map$2 = array$2.map;
var slice$1 = array$2.slice;

var implicit = {name: "implicit"};

function ordinal(range) {
  var index = map$1(),
      domain = [],
      unknown = implicit;

  range = range == null ? [] : slice$1.call(range);

  function scale(d) {
    var key = d + "", i = index.get(key);
    if (!i) {
      if (unknown !== implicit) return unknown;
      index.set(key, i = domain.push(d));
    }
    return range[(i - 1) % range.length];
  }

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [], index = map$1();
    var i = -1, n = _.length, d, key;
    while (++i < n) if (!index.has(key = (d = _[i]) + "")) index.set(key, domain.push(d));
    return scale;
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$1.call(_), scale) : range.slice();
  };

  scale.unknown = function(_) {
    return arguments.length ? (unknown = _, scale) : unknown;
  };

  scale.copy = function() {
    return ordinal()
        .domain(domain)
        .range(range)
        .unknown(unknown);
  };

  return scale;
}

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend$1(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reHex3 = /^#([0-9a-f]{3})$/;
var reHex6 = /^#([0-9a-f]{6})$/;
var reRgbInteger = /^rgb\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*\)$/;
var reRgbPercent = /^rgb\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
var reRgbaInteger = /^rgba\(\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+)\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
var reRgbaPercent = /^rgba\(\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
var reHslPercent = /^hsl\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*\)$/;
var reHslaPercent = /^hsla\(\s*([-+]?\d+(?:\.\d+)?)\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)%\s*,\s*([-+]?\d+(?:\.\d+)?)\s*\)$/;
var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  displayable: function() {
    return this.rgb().displayable();
  },
  toString: function() {
    return this.rgb() + "";
  }
});

function color(format) {
  var m;
  format = (format + "").trim().toLowerCase();
  return (m = reHex3.exec(format)) ? (m = parseInt(m[1], 16), new Rgb((m >> 8 & 0xf) | (m >> 4 & 0x0f0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1)) // #f00
      : (m = reHex6.exec(format)) ? rgbn(parseInt(m[1], 16)) // #ff0000
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format])
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend$1(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb: function() {
    return this;
  },
  displayable: function() {
    return (0 <= this.r && this.r <= 255)
        && (0 <= this.g && this.g <= 255)
        && (0 <= this.b && this.b <= 255)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  toString: function() {
    var a = this.opacity; a = isNaN(a) ? 1 : Math.max(0, Math.min(1, a));
    return (a === 1 ? "rgb(" : "rgba(")
        + Math.max(0, Math.min(255, Math.round(this.r) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.g) || 0)) + ", "
        + Math.max(0, Math.min(255, Math.round(this.b) || 0))
        + (a === 1 ? ")" : ", " + a + ")");
  }
}));

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend$1(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  displayable: function() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  }
}));

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var deg2rad = Math.PI / 180;
var rad2deg = 180 / Math.PI;

var Kn = 18;
var Xn = 0.950470;
var Yn = 1;
var Zn = 1.088830;
var t0$1 = 4 / 29;
var t1$1 = 6 / 29;
var t2 = 3 * t1$1 * t1$1;
var t3 = t1$1 * t1$1 * t1$1;
function labConvert(o) {
  if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
  if (o instanceof Hcl) {
    var h = o.h * deg2rad;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var b = rgb2xyz(o.r),
      a = rgb2xyz(o.g),
      l = rgb2xyz(o.b),
      x = xyz2lab((0.4124564 * b + 0.3575761 * a + 0.1804375 * l) / Xn),
      y = xyz2lab((0.2126729 * b + 0.7151522 * a + 0.0721750 * l) / Yn),
      z = xyz2lab((0.0193339 * b + 0.1191920 * a + 0.9503041 * l) / Zn);
  return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
}

function lab(l, a, b, opacity) {
  return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
}

function Lab(l, a, b, opacity) {
  this.l = +l;
  this.a = +a;
  this.b = +b;
  this.opacity = +opacity;
}

define(Lab, lab, extend$1(Color, {
  brighter: function(k) {
    return new Lab(this.l + Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  darker: function(k) {
    return new Lab(this.l - Kn * (k == null ? 1 : k), this.a, this.b, this.opacity);
  },
  rgb: function() {
    var y = (this.l + 16) / 116,
        x = isNaN(this.a) ? y : y + this.a / 500,
        z = isNaN(this.b) ? y : y - this.b / 200;
    y = Yn * lab2xyz(y);
    x = Xn * lab2xyz(x);
    z = Zn * lab2xyz(z);
    return new Rgb(
      xyz2rgb( 3.2404542 * x - 1.5371385 * y - 0.4985314 * z), // D65 -> sRGB
      xyz2rgb(-0.9692660 * x + 1.8760108 * y + 0.0415560 * z),
      xyz2rgb( 0.0556434 * x - 0.2040259 * y + 1.0572252 * z),
      this.opacity
    );
  }
}));

function xyz2lab(t) {
  return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0$1;
}

function lab2xyz(t) {
  return t > t1$1 ? t * t * t : t2 * (t - t0$1);
}

function xyz2rgb(x) {
  return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
}

function rgb2xyz(x) {
  return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

function hclConvert(o) {
  if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
  if (!(o instanceof Lab)) o = labConvert(o);
  var h = Math.atan2(o.b, o.a) * rad2deg;
  return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
}

function hcl(h, c, l, opacity) {
  return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
}

function Hcl(h, c, l, opacity) {
  this.h = +h;
  this.c = +c;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hcl, hcl, extend$1(Color, {
  brighter: function(k) {
    return new Hcl(this.h, this.c, this.l + Kn * (k == null ? 1 : k), this.opacity);
  },
  darker: function(k) {
    return new Hcl(this.h, this.c, this.l - Kn * (k == null ? 1 : k), this.opacity);
  },
  rgb: function() {
    return labConvert(this).rgb();
  }
}));

var A = -0.14861;
var B = +1.78277;
var C = -0.29227;
var D = -0.90649;
var E = +1.97294;
var ED = E * D;
var EB = E * B;
var BC_DA = B * C - D * A;
function cubehelixConvert(o) {
  if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Rgb)) o = rgbConvert(o);
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
      bl = b - l,
      k = (E * (g - l) - C * bl) / D,
      s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
      h = s ? Math.atan2(k, bl) * rad2deg - 120 : NaN;
  return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
}

function cubehelix(h, s, l, opacity) {
  return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
}

function Cubehelix(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Cubehelix, cubehelix, extend$1(Color, {
  brighter: function(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  darker: function(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
  },
  rgb: function() {
    var h = isNaN(this.h) ? 0 : (this.h + 120) * deg2rad,
        l = +this.l,
        a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
        cosh = Math.cos(h),
        sinh = Math.sin(h);
    return new Rgb(
      255 * (l + a * (A * cosh + B * sinh)),
      255 * (l + a * (C * cosh + D * sinh)),
      255 * (l + a * (E * cosh)),
      this.opacity
    );
  }
}));

function basis(t1, v0, v1, v2, v3) {
  var t2 = t1 * t1, t3 = t2 * t1;
  return ((1 - 3 * t1 + 3 * t2 - t3) * v0
      + (4 - 6 * t2 + 3 * t3) * v1
      + (1 + 3 * t1 + 3 * t2 - 3 * t3) * v2
      + t3 * v3) / 6;
}

function basis$1(values) {
  var n = values.length - 1;
  return function(t) {
    var i = t <= 0 ? (t = 0) : t >= 1 ? (t = 1, n - 1) : Math.floor(t * n),
        v1 = values[i],
        v2 = values[i + 1],
        v0 = i > 0 ? values[i - 1] : 2 * v1 - v2,
        v3 = i < n - 1 ? values[i + 2] : 2 * v2 - v1;
    return basis((t - i / n) * n, v0, v1, v2, v3);
  };
}

function constant$2(x) {
  return function() {
    return x;
  };
}

function linear$1(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function hue(a, b) {
  var d = b - a;
  return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$2(isNaN(a) ? b : a);
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear$1(a, d) : constant$2(isNaN(a) ? b : a);
}

var rgb$1 = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb$$(start, end) {
    var r = color((start = rgb(start)).r, (end = rgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = color(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$$.gamma = rgbGamma;

  return rgb$$;
})(1);

function rgbSpline(spline) {
  return function(colors) {
    var n = colors.length,
        r = new Array(n),
        g = new Array(n),
        b = new Array(n),
        i, color;
    for (i = 0; i < n; ++i) {
      color = rgb(colors[i]);
      r[i] = color.r || 0;
      g[i] = color.g || 0;
      b[i] = color.b || 0;
    }
    r = spline(r);
    g = spline(g);
    b = spline(b);
    color.opacity = 1;
    return function(t) {
      color.r = r(t);
      color.g = g(t);
      color.b = b(t);
      return color + "";
    };
  };
}

var interpolateRgbBasis = rgbSpline(basis$1);

function array$3(a, b) {
  var nb = b ? b.length : 0,
      na = a ? Math.min(nb, a.length) : 0,
      x = new Array(nb),
      c = new Array(nb),
      i;

  for (i = 0; i < na; ++i) x[i] = interpolateValue(a[i], b[i]);
  for (; i < nb; ++i) c[i] = b[i];

  return function(t) {
    for (i = 0; i < na; ++i) c[i] = x[i](t);
    return c;
  };
}

function date(a, b) {
  var d = new Date;
  return a = +a, b -= a, function(t) {
    return d.setTime(a + b * t), d;
  };
}

function reinterpolate(a, b) {
  return a = +a, b -= a, function(t) {
    return a + b * t;
  };
}

function object$1(a, b) {
  var i = {},
      c = {},
      k;

  if (a === null || typeof a !== "object") a = {};
  if (b === null || typeof b !== "object") b = {};

  for (k in b) {
    if (k in a) {
      i[k] = interpolateValue(a[k], b[k]);
    } else {
      c[k] = b[k];
    }
  }

  return function(t) {
    for (k in i) c[k] = i[k](t);
    return c;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g;
var reB = new RegExp(reA.source, "g");
function zero$1(b) {
  return function() {
    return b;
  };
}

function one$1(b) {
  return function(t) {
    return b(t) + "";
  };
}

function string(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: reinterpolate(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one$1(q[0].x)
      : zero$1(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

function interpolateValue(a, b) {
  var t = typeof b, c;
  return b == null || t === "boolean" ? constant$2(b)
      : (t === "number" ? reinterpolate
      : t === "string" ? ((c = color(b)) ? (b = c, rgb$1) : string)
      : b instanceof color ? rgb$1
      : b instanceof Date ? date
      : Array.isArray(b) ? array$3
      : isNaN(b) ? object$1
      : reinterpolate)(a, b);
}

function interpolateRound(a, b) {
  return a = +a, b -= a, function(t) {
    return Math.round(a + b * t);
  };
}

function cubehelix$1(hue) {
  return (function cubehelixGamma(y) {
    y = +y;

    function cubehelix$$(start, end) {
      var h = hue((start = cubehelix(start)).h, (end = cubehelix(end)).h),
          s = nogamma(start.s, end.s),
          l = nogamma(start.l, end.l),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.h = h(t);
        start.s = s(t);
        start.l = l(Math.pow(t, y));
        start.opacity = opacity(t);
        return start + "";
      };
    }

    cubehelix$$.gamma = cubehelixGamma;

    return cubehelix$$;
  })(1);
}

cubehelix$1(hue);
var interpolateCubehelixLong = cubehelix$1(nogamma);

function constant$3(x) {
  return function() {
    return x;
  };
}

function number$2(x) {
  return +x;
}

var unit = [0, 1];

function deinterpolate(a, b) {
  return (b -= (a = +a))
      ? function(x) { return (x - a) / b; }
      : constant$3(b);
}

function deinterpolateClamp(deinterpolate) {
  return function(a, b) {
    var d = deinterpolate(a = +a, b = +b);
    return function(x) { return x <= a ? 0 : x >= b ? 1 : d(x); };
  };
}

function reinterpolateClamp(reinterpolate) {
  return function(a, b) {
    var r = reinterpolate(a = +a, b = +b);
    return function(t) { return t <= 0 ? a : t >= 1 ? b : r(t); };
  };
}

function bimap(domain, range, deinterpolate, reinterpolate) {
  var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
  if (d1 < d0) d0 = deinterpolate(d1, d0), r0 = reinterpolate(r1, r0);
  else d0 = deinterpolate(d0, d1), r0 = reinterpolate(r0, r1);
  return function(x) { return r0(d0(x)); };
}

function polymap(domain, range, deinterpolate, reinterpolate) {
  var j = Math.min(domain.length, range.length) - 1,
      d = new Array(j),
      r = new Array(j),
      i = -1;

  // Reverse descending domains.
  if (domain[j] < domain[0]) {
    domain = domain.slice().reverse();
    range = range.slice().reverse();
  }

  while (++i < j) {
    d[i] = deinterpolate(domain[i], domain[i + 1]);
    r[i] = reinterpolate(range[i], range[i + 1]);
  }

  return function(x) {
    var i = bisectRight(domain, x, 1, j) - 1;
    return r[i](d[i](x));
  };
}

function copy$1(source, target) {
  return target
      .domain(source.domain())
      .range(source.range())
      .interpolate(source.interpolate())
      .clamp(source.clamp());
}

// deinterpolate(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
// reinterpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding domain value x in [a,b].
function continuous(deinterpolate$$, reinterpolate) {
  var domain = unit,
      range = unit,
      interpolate = interpolateValue,
      clamp = false,
      piecewise,
      output,
      input;

  function rescale() {
    piecewise = Math.min(domain.length, range.length) > 2 ? polymap : bimap;
    output = input = null;
    return scale;
  }

  function scale(x) {
    return (output || (output = piecewise(domain, range, clamp ? deinterpolateClamp(deinterpolate$$) : deinterpolate$$, interpolate)))(+x);
  }

  scale.invert = function(y) {
    return (input || (input = piecewise(range, domain, deinterpolate, clamp ? reinterpolateClamp(reinterpolate) : reinterpolate)))(+y);
  };

  scale.domain = function(_) {
    return arguments.length ? (domain = map$2.call(_, number$2), rescale()) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
  };

  scale.rangeRound = function(_) {
    return range = slice$1.call(_), interpolate = interpolateRound, rescale();
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = !!_, rescale()) : clamp;
  };

  scale.interpolate = function(_) {
    return arguments.length ? (interpolate = _, rescale()) : interpolate;
  };

  return rescale();
}

// Computes the decimal coefficient and exponent of the specified number x with
// significant digits p, where x is positive and p is in [1, 21] or undefined.
// For example, formatDecimal(1.23) returns ["123", 0].
function formatDecimal(x, p) {
  if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
  var i, coefficient = x.slice(0, i);

  // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
  // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
  return [
    coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
    +x.slice(i + 1)
  ];
}

function exponent(x) {
  return x = formatDecimal(Math.abs(x)), x ? x[1] : NaN;
}

function formatGroup(grouping, thousands) {
  return function(value, width) {
    var i = value.length,
        t = [],
        j = 0,
        g = grouping[0],
        length = 0;

    while (i > 0 && g > 0) {
      if (length + g + 1 > width) g = Math.max(1, width - length);
      t.push(value.substring(i -= g, i + g));
      if ((length += g + 1) > width) break;
      g = grouping[j = (j + 1) % grouping.length];
    }

    return t.reverse().join(thousands);
  };
}

function formatDefault(x, p) {
  x = x.toPrecision(p);

  out: for (var n = x.length, i = 1, i0 = -1, i1; i < n; ++i) {
    switch (x[i]) {
      case ".": i0 = i1 = i; break;
      case "0": if (i0 === 0) i0 = i; i1 = i; break;
      case "e": break out;
      default: if (i0 > 0) i0 = 0; break;
    }
  }

  return i0 > 0 ? x.slice(0, i0) + x.slice(i1 + 1) : x;
}

var prefixExponent;

function formatPrefixAuto(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1],
      i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
      n = coefficient.length;
  return i === n ? coefficient
      : i > n ? coefficient + new Array(i - n + 1).join("0")
      : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
      : "0." + new Array(1 - i).join("0") + formatDecimal(x, Math.max(0, p + i - 1))[0]; // less than 1y!
}

function formatRounded(x, p) {
  var d = formatDecimal(x, p);
  if (!d) return x + "";
  var coefficient = d[0],
      exponent = d[1];
  return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
      : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
      : coefficient + new Array(exponent - coefficient.length + 2).join("0");
}

var formatTypes = {
  "": formatDefault,
  "%": function(x, p) { return (x * 100).toFixed(p); },
  "b": function(x) { return Math.round(x).toString(2); },
  "c": function(x) { return x + ""; },
  "d": function(x) { return Math.round(x).toString(10); },
  "e": function(x, p) { return x.toExponential(p); },
  "f": function(x, p) { return x.toFixed(p); },
  "g": function(x, p) { return x.toPrecision(p); },
  "o": function(x) { return Math.round(x).toString(8); },
  "p": function(x, p) { return formatRounded(x * 100, p); },
  "r": formatRounded,
  "s": formatPrefixAuto,
  "X": function(x) { return Math.round(x).toString(16).toUpperCase(); },
  "x": function(x) { return Math.round(x).toString(16); }
};

// [[fill]align][sign][symbol][0][width][,][.precision][type]
var re = /^(?:(.)?([<>=^]))?([+\-\( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?([a-z%])?$/i;

function formatSpecifier(specifier) {
  return new FormatSpecifier(specifier);
}

function FormatSpecifier(specifier) {
  if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);

  var match,
      fill = match[1] || " ",
      align = match[2] || ">",
      sign = match[3] || "-",
      symbol = match[4] || "",
      zero = !!match[5],
      width = match[6] && +match[6],
      comma = !!match[7],
      precision = match[8] && +match[8].slice(1),
      type = match[9] || "";

  // The "n" type is an alias for ",g".
  if (type === "n") comma = true, type = "g";

  // Map invalid types to the default format.
  else if (!formatTypes[type]) type = "";

  // If zero fill is specified, padding goes after sign and before digits.
  if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

  this.fill = fill;
  this.align = align;
  this.sign = sign;
  this.symbol = symbol;
  this.zero = zero;
  this.width = width;
  this.comma = comma;
  this.precision = precision;
  this.type = type;
}

FormatSpecifier.prototype.toString = function() {
  return this.fill
      + this.align
      + this.sign
      + this.symbol
      + (this.zero ? "0" : "")
      + (this.width == null ? "" : Math.max(1, this.width | 0))
      + (this.comma ? "," : "")
      + (this.precision == null ? "" : "." + Math.max(0, this.precision | 0))
      + this.type;
};

var prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

function identity$4(x) {
  return x;
}

function formatLocale$1(locale) {
  var group = locale.grouping && locale.thousands ? formatGroup(locale.grouping, locale.thousands) : identity$4,
      currency = locale.currency,
      decimal = locale.decimal;

  function newFormat(specifier) {
    specifier = formatSpecifier(specifier);

    var fill = specifier.fill,
        align = specifier.align,
        sign = specifier.sign,
        symbol = specifier.symbol,
        zero = specifier.zero,
        width = specifier.width,
        comma = specifier.comma,
        precision = specifier.precision,
        type = specifier.type;

    // Compute the prefix and suffix.
    // For SI-prefix, the suffix is lazily computed.
    var prefix = symbol === "$" ? currency[0] : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
        suffix = symbol === "$" ? currency[1] : /[%p]/.test(type) ? "%" : "";

    // What format function should we use?
    // Is this an integer type?
    // Can this type generate exponential notation?
    var formatType = formatTypes[type],
        maybeSuffix = !type || /[defgprs%]/.test(type);

    // Set the default precision if not specified,
    // or clamp the specified precision to the supported range.
    // For significant precision, it must be in [1, 21].
    // For fixed precision, it must be in [0, 20].
    precision = precision == null ? (type ? 6 : 12)
        : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
        : Math.max(0, Math.min(20, precision));

    function format(value) {
      var valuePrefix = prefix,
          valueSuffix = suffix,
          i, n, c;

      if (type === "c") {
        valueSuffix = formatType(value) + valueSuffix;
        value = "";
      } else {
        value = +value;

        // Convert negative to positive, and compute the prefix.
        // Note that -0 is not less than 0, but 1 / -0 is!
        var valueNegative = (value < 0 || 1 / value < 0) && (value *= -1, true);

        // Perform the initial formatting.
        value = formatType(value, precision);

        // If the original value was negative, it may be rounded to zero during
        // formatting; treat this as (positive) zero.
        if (valueNegative) {
          i = -1, n = value.length;
          valueNegative = false;
          while (++i < n) {
            if (c = value.charCodeAt(i), (48 < c && c < 58)
                || (type === "x" && 96 < c && c < 103)
                || (type === "X" && 64 < c && c < 71)) {
              valueNegative = true;
              break;
            }
          }
        }

        // Compute the prefix and suffix.
        valuePrefix = (valueNegative ? (sign === "(" ? sign : "-") : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
        valueSuffix = valueSuffix + (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + (valueNegative && sign === "(" ? ")" : "");

        // Break the formatted value into the integer “value” part that can be
        // grouped, and fractional or exponential “suffix” part that is not.
        if (maybeSuffix) {
          i = -1, n = value.length;
          while (++i < n) {
            if (c = value.charCodeAt(i), 48 > c || c > 57) {
              valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
              value = value.slice(0, i);
              break;
            }
          }
        }
      }

      // If the fill character is not "0", grouping is applied before padding.
      if (comma && !zero) value = group(value, Infinity);

      // Compute the padding.
      var length = valuePrefix.length + value.length + valueSuffix.length,
          padding = length < width ? new Array(width - length + 1).join(fill) : "";

      // If the fill character is "0", grouping is applied after padding.
      if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

      // Reconstruct the final output based on the desired alignment.
      switch (align) {
        case "<": return valuePrefix + value + valueSuffix + padding;
        case "=": return valuePrefix + padding + value + valueSuffix;
        case "^": return padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length);
      }
      return padding + valuePrefix + value + valueSuffix;
    }

    format.toString = function() {
      return specifier + "";
    };

    return format;
  }

  function formatPrefix(specifier, value) {
    var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
        e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
        k = Math.pow(10, -e),
        prefix = prefixes[8 + e / 3];
    return function(value) {
      return f(k * value) + prefix;
    };
  }

  return {
    format: newFormat,
    formatPrefix: formatPrefix
  };
}

var locale$1;
var format;
var formatPrefix;

defaultLocale$1({
  decimal: ".",
  thousands: ",",
  grouping: [3],
  currency: ["$", ""]
});

function defaultLocale$1(definition) {
  locale$1 = formatLocale$1(definition);
  format = locale$1.format;
  formatPrefix = locale$1.formatPrefix;
  return locale$1;
}

function precisionFixed(step) {
  return Math.max(0, -exponent(Math.abs(step)));
}

function precisionPrefix(step, value) {
  return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
}

function precisionRound(step, max) {
  step = Math.abs(step), max = Math.abs(max) - step;
  return Math.max(0, exponent(max) - exponent(step)) + 1;
}

function tickFormat(domain, count, specifier) {
  var start = domain[0],
      stop = domain[domain.length - 1],
      step = tickStep(start, stop, count == null ? 10 : count),
      precision;
  specifier = formatSpecifier(specifier == null ? ",f" : specifier);
  switch (specifier.type) {
    case "s": {
      var value = Math.max(Math.abs(start), Math.abs(stop));
      if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
      return formatPrefix(specifier, value);
    }
    case "":
    case "e":
    case "g":
    case "p":
    case "r": {
      if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
      break;
    }
    case "f":
    case "%": {
      if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
      break;
    }
  }
  return format(specifier);
}

function linearish(scale) {
  var domain = scale.domain;

  scale.ticks = function(count) {
    var d = domain();
    return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
  };

  scale.tickFormat = function(count, specifier) {
    return tickFormat(domain(), count, specifier);
  };

  scale.nice = function(count) {
    var d = domain(),
        i = d.length - 1,
        n = count == null ? 10 : count,
        start = d[0],
        stop = d[i],
        step = tickStep(start, stop, n);

    if (step) {
      step = tickStep(Math.floor(start / step) * step, Math.ceil(stop / step) * step, n);
      d[0] = Math.floor(start / step) * step;
      d[i] = Math.ceil(stop / step) * step;
      domain(d);
    }

    return scale;
  };

  return scale;
}

function linear() {
  var scale = continuous(deinterpolate, reinterpolate);

  scale.copy = function() {
    return copy$1(scale, linear());
  };

  return linearish(scale);
}

function identity$2() {
  var domain = [0, 1];

  function scale(x) {
    return +x;
  }

  scale.invert = scale;

  scale.domain = scale.range = function(_) {
    return arguments.length ? (domain = map$2.call(_, number$2), scale) : domain.slice();
  };

  scale.copy = function() {
    return identity$2().domain(domain);
  };

  return linearish(scale);
}

function nice(domain, interval) {
  domain = domain.slice();

  var i0 = 0,
      i1 = domain.length - 1,
      x0 = domain[i0],
      x1 = domain[i1],
      t;

  if (x1 < x0) {
    t = i0, i0 = i1, i1 = t;
    t = x0, x0 = x1, x1 = t;
  }

  domain[i0] = interval.floor(x0);
  domain[i1] = interval.ceil(x1);
  return domain;
}

function deinterpolate$1(a, b) {
  return (b = Math.log(b / a))
      ? function(x) { return Math.log(x / a) / b; }
      : constant$3(b);
}

function reinterpolate$1(a, b) {
  return a < 0
      ? function(t) { return -Math.pow(-b, t) * Math.pow(-a, 1 - t); }
      : function(t) { return Math.pow(b, t) * Math.pow(a, 1 - t); };
}

function pow10(x) {
  return isFinite(x) ? +("1e" + x) : x < 0 ? 0 : x;
}

function powp(base) {
  return base === 10 ? pow10
      : base === Math.E ? Math.exp
      : function(x) { return Math.pow(base, x); };
}

function logp(base) {
  return base === Math.E ? Math.log
      : base === 10 && Math.log10
      || base === 2 && Math.log2
      || (base = Math.log(base), function(x) { return Math.log(x) / base; });
}

function reflect(f) {
  return function(x) {
    return -f(-x);
  };
}

function log$1() {
  var scale = continuous(deinterpolate$1, reinterpolate$1).domain([1, 10]),
      domain = scale.domain,
      base = 10,
      logs = logp(10),
      pows = powp(10);

  function rescale() {
    logs = logp(base), pows = powp(base);
    if (domain()[0] < 0) logs = reflect(logs), pows = reflect(pows);
    return scale;
  }

  scale.base = function(_) {
    return arguments.length ? (base = +_, rescale()) : base;
  };

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.ticks = function(count) {
    var d = domain(),
        u = d[0],
        v = d[d.length - 1],
        r;

    if (r = v < u) i = u, u = v, v = i;

    var i = logs(u),
        j = logs(v),
        p,
        k,
        t,
        n = count == null ? 10 : +count,
        z = [];

    if (!(base % 1) && j - i < n) {
      i = Math.round(i) - 1, j = Math.round(j) + 1;
      if (u > 0) for (; i < j; ++i) {
        for (k = 1, p = pows(i); k < base; ++k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      } else for (; i < j; ++i) {
        for (k = base - 1, p = pows(i); k >= 1; --k) {
          t = p * k;
          if (t < u) continue;
          if (t > v) break;
          z.push(t);
        }
      }
    } else {
      z = ticks(i, j, Math.min(j - i, n)).map(pows);
    }

    return r ? z.reverse() : z;
  };

  scale.tickFormat = function(count, specifier) {
    if (specifier == null) specifier = base === 10 ? ".0e" : ",";
    if (typeof specifier !== "function") specifier = format(specifier);
    if (count === Infinity) return specifier;
    if (count == null) count = 10;
    var k = Math.max(1, base * count / scale.ticks().length); // TODO fast estimate?
    return function(d) {
      var i = d / pows(Math.round(logs(d)));
      if (i * base < base - 0.5) i *= base;
      return i <= k ? specifier(d) : "";
    };
  };

  scale.nice = function() {
    return domain(nice(domain(), {
      floor: function(x) { return pows(Math.floor(logs(x))); },
      ceil: function(x) { return pows(Math.ceil(logs(x))); }
    }));
  };

  scale.copy = function() {
    return copy$1(scale, log$1().base(base));
  };

  return scale;
}

function raise(x, exponent) {
  return x < 0 ? -Math.pow(-x, exponent) : Math.pow(x, exponent);
}

function pow() {
  var exponent = 1,
      scale = continuous(deinterpolate, reinterpolate),
      domain = scale.domain;

  function deinterpolate(a, b) {
    return (b = raise(b, exponent) - (a = raise(a, exponent)))
        ? function(x) { return (raise(x, exponent) - a) / b; }
        : constant$3(b);
  }

  function reinterpolate(a, b) {
    b = raise(b, exponent) - (a = raise(a, exponent));
    return function(t) { return raise(a + b * t, 1 / exponent); };
  }

  scale.exponent = function(_) {
    return arguments.length ? (exponent = +_, domain(domain())) : exponent;
  };

  scale.copy = function() {
    return copy$1(scale, pow().exponent(exponent));
  };

  return linearish(scale);
}

function sqrt() {
  return pow().exponent(0.5);
}

function quantile() {
  var domain = [],
      range = [],
      thresholds = [];

  function rescale() {
    var i = 0, n = Math.max(1, range.length);
    thresholds = new Array(n - 1);
    while (++i < n) thresholds[i - 1] = threshold(domain, i / n);
    return scale;
  }

  function scale(x) {
    if (!isNaN(x = +x)) return range[bisectRight(thresholds, x)];
  }

  scale.invertExtent = function(y) {
    var i = range.indexOf(y);
    return i < 0 ? [NaN, NaN] : [
      i > 0 ? thresholds[i - 1] : domain[0],
      i < thresholds.length ? thresholds[i] : domain[domain.length - 1]
    ];
  };

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = [];
    for (var i = 0, n = _.length, d; i < n; ++i) if (d = _[i], d != null && !isNaN(d = +d)) domain.push(d);
    domain.sort(ascending);
    return rescale();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$1.call(_), rescale()) : range.slice();
  };

  scale.quantiles = function() {
    return thresholds.slice();
  };

  scale.copy = function() {
    return quantile()
        .domain(domain)
        .range(range);
  };

  return scale;
}

function quantize$1() {
  var x0 = 0,
      x1 = 1,
      n = 1,
      domain = [0.5],
      range = [0, 1];

  function scale(x) {
    if (x <= x) return range[bisectRight(domain, x, 0, n)];
  }

  function rescale() {
    var i = -1;
    domain = new Array(n);
    while (++i < n) domain[i] = ((i + 1) * x1 - (i - n) * x0) / (n + 1);
    return scale;
  }

  scale.domain = function(_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], rescale()) : [x0, x1];
  };

  scale.range = function(_) {
    return arguments.length ? (n = (range = slice$1.call(_)).length - 1, rescale()) : range.slice();
  };

  scale.invertExtent = function(y) {
    var i = range.indexOf(y);
    return i < 0 ? [NaN, NaN]
        : i < 1 ? [x0, domain[0]]
        : i >= n ? [domain[n - 1], x1]
        : [domain[i - 1], domain[i]];
  };

  scale.copy = function() {
    return quantize$1()
        .domain([x0, x1])
        .range(range);
  };

  return linearish(scale);
}

function threshold$1() {
  var domain = [0.5],
      range = [0, 1],
      n = 1;

  function scale(x) {
    if (x <= x) return range[bisectRight(domain, x, 0, n)];
  }

  scale.domain = function(_) {
    return arguments.length ? (domain = slice$1.call(_), n = Math.min(domain.length, range.length - 1), scale) : domain.slice();
  };

  scale.range = function(_) {
    return arguments.length ? (range = slice$1.call(_), n = Math.min(domain.length, range.length - 1), scale) : range.slice();
  };

  scale.invertExtent = function(y) {
    var i = range.indexOf(y);
    return [domain[i - 1], domain[i]];
  };

  scale.copy = function() {
    return threshold$1()
        .domain(domain)
        .range(range);
  };

  return scale;
}

var durationSecond$1 = 1000;
var durationMinute$1 = durationSecond$1 * 60;
var durationHour$1 = durationMinute$1 * 60;
var durationDay$1 = durationHour$1 * 24;
var durationWeek$1 = durationDay$1 * 7;
var durationMonth = durationDay$1 * 30;
var durationYear = durationDay$1 * 365;
function date$1(t) {
  return new Date(t);
}

function number$3(t) {
  return t instanceof Date ? +t : +new Date(+t);
}

function calendar(year, month, week, day, hour, minute, second, millisecond, format) {
  var scale = continuous(deinterpolate, reinterpolate),
      invert = scale.invert,
      domain = scale.domain;

  var formatMillisecond = format(".%L"),
      formatSecond = format(":%S"),
      formatMinute = format("%I:%M"),
      formatHour = format("%I %p"),
      formatDay = format("%a %d"),
      formatWeek = format("%b %d"),
      formatMonth = format("%B"),
      formatYear = format("%Y");

  var tickIntervals = [
    [second,  1,      durationSecond$1],
    [second,  5,  5 * durationSecond$1],
    [second, 15, 15 * durationSecond$1],
    [second, 30, 30 * durationSecond$1],
    [minute,  1,      durationMinute$1],
    [minute,  5,  5 * durationMinute$1],
    [minute, 15, 15 * durationMinute$1],
    [minute, 30, 30 * durationMinute$1],
    [  hour,  1,      durationHour$1  ],
    [  hour,  3,  3 * durationHour$1  ],
    [  hour,  6,  6 * durationHour$1  ],
    [  hour, 12, 12 * durationHour$1  ],
    [   day,  1,      durationDay$1   ],
    [   day,  2,  2 * durationDay$1   ],
    [  week,  1,      durationWeek$1  ],
    [ month,  1,      durationMonth ],
    [ month,  3,  3 * durationMonth ],
    [  year,  1,      durationYear  ]
  ];

  function tickFormat(date) {
    return (second(date) < date ? formatMillisecond
        : minute(date) < date ? formatSecond
        : hour(date) < date ? formatMinute
        : day(date) < date ? formatHour
        : month(date) < date ? (week(date) < date ? formatDay : formatWeek)
        : year(date) < date ? formatMonth
        : formatYear)(date);
  }

  function tickInterval(interval, start, stop, step) {
    if (interval == null) interval = 10;

    // If a desired tick count is specified, pick a reasonable tick interval
    // based on the extent of the domain and a rough estimate of tick size.
    // Otherwise, assume interval is already a time interval and use it.
    if (typeof interval === "number") {
      var target = Math.abs(stop - start) / interval,
          i = bisector(function(i) { return i[2]; }).right(tickIntervals, target);
      if (i === tickIntervals.length) {
        step = tickStep(start / durationYear, stop / durationYear, interval);
        interval = year;
      } else if (i) {
        i = tickIntervals[target / tickIntervals[i - 1][2] < tickIntervals[i][2] / target ? i - 1 : i];
        step = i[1];
        interval = i[0];
      } else {
        step = tickStep(start, stop, interval);
        interval = millisecond;
      }
    }

    return step == null ? interval : interval.every(step);
  }

  scale.invert = function(y) {
    return new Date(invert(y));
  };

  scale.domain = function(_) {
    return arguments.length ? domain(map$2.call(_, number$3)) : domain().map(date$1);
  };

  scale.ticks = function(interval, step) {
    var d = domain(),
        t0 = d[0],
        t1 = d[d.length - 1],
        r = t1 < t0,
        t;
    if (r) t = t0, t0 = t1, t1 = t;
    t = tickInterval(interval, t0, t1, step);
    t = t ? t.range(t0, t1 + 1) : []; // inclusive stop
    return r ? t.reverse() : t;
  };

  scale.tickFormat = function(count, specifier) {
    return specifier == null ? tickFormat : format(specifier);
  };

  scale.nice = function(interval, step) {
    var d = domain();
    return (interval = tickInterval(interval, d[0], d[d.length - 1], step))
        ? domain(nice(d, interval))
        : scale;
  };

  scale.copy = function() {
    return copy$1(scale, calendar(year, month, week, day, hour, minute, second, millisecond, format));
  };

  return scale;
}

function scaleTime() {
  return calendar(year, month, timeWeek, day, hour, minute, second, millisecond, timeFormat).domain([new Date(2000, 0, 1), new Date(2000, 0, 2)]);
}

function scaleUtc() {
  return calendar(utcYear, utcMonth, utcWeek, utcDay, utcHour, utcMinute, second, millisecond, utcFormat).domain([Date.UTC(2000, 0, 1), Date.UTC(2000, 0, 2)]);
}

function colors(s) {
  return s.match(/.{6}/g).map(function(x) {
    return "#" + x;
  });
}

var schemeCategory10 = colors("1f77b4ff7f0e2ca02cd627289467bd8c564be377c27f7f7fbcbd2217becf");

var schemeCategory20b = colors("393b795254a36b6ecf9c9ede6379398ca252b5cf6bcedb9c8c6d31bd9e39e7ba52e7cb94843c39ad494ad6616be7969c7b4173a55194ce6dbdde9ed6");

var schemeCategory20c = colors("3182bd6baed69ecae1c6dbefe6550dfd8d3cfdae6bfdd0a231a35474c476a1d99bc7e9c0756bb19e9ac8bcbddcdadaeb636363969696bdbdbdd9d9d9");

var schemeCategory20 = colors("1f77b4aec7e8ff7f0effbb782ca02c98df8ad62728ff98969467bdc5b0d58c564bc49c94e377c2f7b6d27f7f7fc7c7c7bcbd22dbdb8d17becf9edae5");

var interpolateCubehelixDefault = interpolateCubehelixLong(cubehelix(300, 0.5, 0.0), cubehelix(-240, 0.5, 1.0));

var interpolateWarm = interpolateCubehelixLong(cubehelix(-100, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var interpolateCool = interpolateCubehelixLong(cubehelix(260, 0.75, 0.35), cubehelix(80, 1.50, 0.8));

var rainbow = cubehelix();

function interpolateRainbow(t) {
  if (t < 0 || t > 1) t -= Math.floor(t);
  var ts = Math.abs(t - 0.5);
  rainbow.h = 360 * t - 100;
  rainbow.s = 1.5 - 1.5 * ts;
  rainbow.l = 0.8 - 0.9 * ts;
  return rainbow + "";
}

function ramp(range) {
  var n = range.length;
  return function(t) {
    return range[Math.max(0, Math.min(n - 1, Math.floor(t * n)))];
  };
}

var interpolateViridis = ramp(colors("44015444025645045745055946075a46085c460a5d460b5e470d60470e6147106347116447136548146748166848176948186a481a6c481b6d481c6e481d6f481f70482071482173482374482475482576482677482878482979472a7a472c7a472d7b472e7c472f7d46307e46327e46337f463480453581453781453882443983443a83443b84433d84433e85423f854240864241864142874144874045884046883f47883f48893e49893e4a893e4c8a3d4d8a3d4e8a3c4f8a3c508b3b518b3b528b3a538b3a548c39558c39568c38588c38598c375a8c375b8d365c8d365d8d355e8d355f8d34608d34618d33628d33638d32648e32658e31668e31678e31688e30698e306a8e2f6b8e2f6c8e2e6d8e2e6e8e2e6f8e2d708e2d718e2c718e2c728e2c738e2b748e2b758e2a768e2a778e2a788e29798e297a8e297b8e287c8e287d8e277e8e277f8e27808e26818e26828e26828e25838e25848e25858e24868e24878e23888e23898e238a8d228b8d228c8d228d8d218e8d218f8d21908d21918c20928c20928c20938c1f948c1f958b1f968b1f978b1f988b1f998a1f9a8a1e9b8a1e9c891e9d891f9e891f9f881fa0881fa1881fa1871fa28720a38620a48621a58521a68522a78522a88423a98324aa8325ab8225ac8226ad8127ad8128ae8029af7f2ab07f2cb17e2db27d2eb37c2fb47c31b57b32b67a34b67935b77937b87838b9773aba763bbb753dbc743fbc7340bd7242be7144bf7046c06f48c16e4ac16d4cc26c4ec36b50c46a52c56954c56856c66758c7655ac8645cc8635ec96260ca6063cb5f65cb5e67cc5c69cd5b6ccd5a6ece5870cf5773d05675d05477d1537ad1517cd2507fd34e81d34d84d44b86d54989d5488bd6468ed64590d74393d74195d84098d83e9bd93c9dd93ba0da39a2da37a5db36a8db34aadc32addc30b0dd2fb2dd2db5de2bb8de29bade28bddf26c0df25c2df23c5e021c8e020cae11fcde11dd0e11cd2e21bd5e21ad8e219dae319dde318dfe318e2e418e5e419e7e419eae51aece51befe51cf1e51df4e61ef6e620f8e621fbe723fde725"));

var interpolateMagma = ramp(colors("00000401000501010601010802010902020b02020d03030f03031204041405041606051806051a07061c08071e0907200a08220b09240c09260d0a290e0b2b100b2d110c2f120d31130d34140e36150e38160f3b180f3d19103f1a10421c10441d11471e114920114b21114e22115024125325125527125829115a2a115c2c115f2d11612f116331116533106734106936106b38106c390f6e3b0f703d0f713f0f72400f74420f75440f764510774710784910784a10794c117a4e117b4f127b51127c52137c54137d56147d57157e59157e5a167e5c167f5d177f5f187f601880621980641a80651a80671b80681c816a1c816b1d816d1d816e1e81701f81721f817320817521817621817822817922827b23827c23827e24828025828125818326818426818627818827818928818b29818c29818e2a81902a81912b81932b80942c80962c80982d80992d809b2e7f9c2e7f9e2f7fa02f7fa1307ea3307ea5317ea6317da8327daa337dab337cad347cae347bb0357bb2357bb3367ab5367ab73779b83779ba3878bc3978bd3977bf3a77c03a76c23b75c43c75c53c74c73d73c83e73ca3e72cc3f71cd4071cf4070d0416fd2426fd3436ed5446dd6456cd8456cd9466bdb476adc4869de4968df4a68e04c67e24d66e34e65e44f64e55064e75263e85362e95462ea5661eb5760ec5860ed5a5fee5b5eef5d5ef05f5ef1605df2625df2645cf3655cf4675cf4695cf56b5cf66c5cf66e5cf7705cf7725cf8745cf8765cf9785df9795df97b5dfa7d5efa7f5efa815ffb835ffb8560fb8761fc8961fc8a62fc8c63fc8e64fc9065fd9266fd9467fd9668fd9869fd9a6afd9b6bfe9d6cfe9f6dfea16efea36ffea571fea772fea973feaa74feac76feae77feb078feb27afeb47bfeb67cfeb77efeb97ffebb81febd82febf84fec185fec287fec488fec68afec88cfeca8dfecc8ffecd90fecf92fed194fed395fed597fed799fed89afdda9cfddc9efddea0fde0a1fde2a3fde3a5fde5a7fde7a9fde9aafdebacfcecaefceeb0fcf0b2fcf2b4fcf4b6fcf6b8fcf7b9fcf9bbfcfbbdfcfdbf"));

var interpolateInferno = ramp(colors("00000401000501010601010802010a02020c02020e03021004031204031405041706041907051b08051d09061f0a07220b07240c08260d08290e092b10092d110a30120a32140b34150b37160b39180c3c190c3e1b0c411c0c431e0c451f0c48210c4a230c4c240c4f260c51280b53290b552b0b572d0b592f0a5b310a5c320a5e340a5f3609613809623909633b09643d09653e0966400a67420a68440a68450a69470b6a490b6a4a0c6b4c0c6b4d0d6c4f0d6c510e6c520e6d540f6d550f6d57106e59106e5a116e5c126e5d126e5f136e61136e62146e64156e65156e67166e69166e6a176e6c186e6d186e6f196e71196e721a6e741a6e751b6e771c6d781c6d7a1d6d7c1d6d7d1e6d7f1e6c801f6c82206c84206b85216b87216b88226a8a226a8c23698d23698f24699025689225689326679526679727669827669a28659b29649d29649f2a63a02a63a22b62a32c61a52c60a62d60a82e5fa92e5eab2f5ead305dae305cb0315bb1325ab3325ab43359b63458b73557b93556ba3655bc3754bd3853bf3952c03a51c13a50c33b4fc43c4ec63d4dc73e4cc83f4bca404acb4149cc4248ce4347cf4446d04545d24644d34743d44842d54a41d74b3fd84c3ed94d3dda4e3cdb503bdd513ade5238df5337e05536e15635e25734e35933e45a31e55c30e65d2fe75e2ee8602de9612bea632aeb6429eb6628ec6726ed6925ee6a24ef6c23ef6e21f06f20f1711ff1731df2741cf3761bf37819f47918f57b17f57d15f67e14f68013f78212f78410f8850ff8870ef8890cf98b0bf98c0af98e09fa9008fa9207fa9407fb9606fb9706fb9906fb9b06fb9d07fc9f07fca108fca309fca50afca60cfca80dfcaa0ffcac11fcae12fcb014fcb216fcb418fbb61afbb81dfbba1ffbbc21fbbe23fac026fac228fac42afac62df9c72ff9c932f9cb35f8cd37f8cf3af7d13df7d340f6d543f6d746f5d949f5db4cf4dd4ff4df53f4e156f3e35af3e55df2e661f2e865f2ea69f1ec6df1ed71f1ef75f1f179f2f27df2f482f3f586f3f68af4f88ef5f992f6fa96f8fb9af9fc9dfafda1fcffa4"));

var interpolatePlasma = ramp(colors("0d088710078813078916078a19068c1b068d1d068e20068f2206902406912605912805922a05932c05942e05952f059631059733059735049837049938049a3a049a3c049b3e049c3f049c41049d43039e44039e46039f48039f4903a04b03a14c02a14e02a25002a25102a35302a35502a45601a45801a45901a55b01a55c01a65e01a66001a66100a76300a76400a76600a76700a86900a86a00a86c00a86e00a86f00a87100a87201a87401a87501a87701a87801a87a02a87b02a87d03a87e03a88004a88104a78305a78405a78606a68707a68808a68a09a58b0aa58d0ba58e0ca48f0da4910ea3920fa39410a29511a19613a19814a099159f9a169f9c179e9d189d9e199da01a9ca11b9ba21d9aa31e9aa51f99a62098a72197a82296aa2395ab2494ac2694ad2793ae2892b02991b12a90b22b8fb32c8eb42e8db52f8cb6308bb7318ab83289ba3388bb3488bc3587bd3786be3885bf3984c03a83c13b82c23c81c33d80c43e7fc5407ec6417dc7427cc8437bc9447aca457acb4679cc4778cc4977cd4a76ce4b75cf4c74d04d73d14e72d24f71d35171d45270d5536fd5546ed6556dd7566cd8576bd9586ada5a6ada5b69db5c68dc5d67dd5e66de5f65de6164df6263e06363e16462e26561e26660e3685fe4695ee56a5de56b5de66c5ce76e5be76f5ae87059e97158e97257ea7457eb7556eb7655ec7754ed7953ed7a52ee7b51ef7c51ef7e50f07f4ff0804ef1814df1834cf2844bf3854bf3874af48849f48948f58b47f58c46f68d45f68f44f79044f79143f79342f89441f89540f9973ff9983ef99a3efa9b3dfa9c3cfa9e3bfb9f3afba139fba238fca338fca537fca636fca835fca934fdab33fdac33fdae32fdaf31fdb130fdb22ffdb42ffdb52efeb72dfeb82cfeba2cfebb2bfebd2afebe2afec029fdc229fdc328fdc527fdc627fdc827fdca26fdcb26fccd25fcce25fcd025fcd225fbd324fbd524fbd724fad824fada24f9dc24f9dd25f8df25f8e125f7e225f7e425f6e626f6e826f5e926f5eb27f4ed27f3ee27f3f027f2f227f1f426f1f525f0f724f0f921"));

function sequential(interpolator) {
  var x0 = 0,
      x1 = 1,
      clamp = false;

  function scale(x) {
    var t = (x - x0) / (x1 - x0);
    return interpolator(clamp ? Math.max(0, Math.min(1, t)) : t);
  }

  scale.domain = function(_) {
    return arguments.length ? (x0 = +_[0], x1 = +_[1], scale) : [x0, x1];
  };

  scale.clamp = function(_) {
    return arguments.length ? (clamp = !!_, scale) : clamp;
  };

  scale.interpolator = function(_) {
    return arguments.length ? (interpolator = _, scale) : interpolator;
  };

  scale.copy = function() {
    return sequential(interpolator).domain([x0, x1]).clamp(clamp);
  };

  return linearish(scale);
}

function band() {
  var scale = ordinal().unknown(undefined),
      domain = scale.domain,
      ordinalRange = scale.range,
      range$$ = [0, 1],
      step,
      bandwidth,
      round = false,
      paddingInner = 0,
      paddingOuter = 0,
      align = 0.5;

  delete scale.unknown;

  function rescale() {
    var n = domain().length,
        reverse = range$$[1] < range$$[0],
        start = range$$[reverse - 0],
        stop = range$$[1 - reverse];
    step = (stop - start) / Math.max(1, n - paddingInner + paddingOuter * 2);
    if (round) step = Math.floor(step);
    start += (stop - start - step * (n - paddingInner)) * align;
    bandwidth = step * (1 - paddingInner);
    if (round) start = Math.round(start), bandwidth = Math.round(bandwidth);
    var values = range(n).map(function(i) { return start + step * i; });
    return ordinalRange(reverse ? values.reverse() : values);
  }

  scale.domain = function(_) {
    return arguments.length ? (domain(_), rescale()) : domain();
  };

  scale.range = function(_) {
    return arguments.length ? (range$$ = [+_[0], +_[1]], rescale()) : range$$.slice();
  };

  scale.rangeRound = function(_) {
    return range$$ = [+_[0], +_[1]], round = true, rescale();
  };

  scale.bandwidth = function() {
    return bandwidth;
  };

  scale.step = function() {
    return step;
  };

  scale.round = function(_) {
    return arguments.length ? (round = !!_, rescale()) : round;
  };

  scale.padding = function(_) {
    return arguments.length ? (paddingInner = paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingInner = function(_) {
    return arguments.length ? (paddingInner = Math.max(0, Math.min(1, _)), rescale()) : paddingInner;
  };

  scale.paddingOuter = function(_) {
    return arguments.length ? (paddingOuter = Math.max(0, Math.min(1, _)), rescale()) : paddingOuter;
  };

  scale.align = function(_) {
    return arguments.length ? (align = Math.max(0, Math.min(1, _)), rescale()) : align;
  };

  scale.invertRange = function(_) {
    var lo = +_[0],
        hi = +_[1],
        reverse = range$$[1] < range$$[0],
        values = reverse ? ordinalRange().reverse() : ordinalRange(),
        n = values.length - 1, a, b, t;

    // order range inputs, bail if outside of scale range
    if (hi < lo) t = lo, lo = hi, hi = t;
    if (hi < values[0] || lo > range$$[1-reverse]) return undefined;

    // binary search to index into scale range
    a = Math.max(0, bisectRight(values, lo) - 1);
    b = lo===hi ? a : bisectRight(values, hi) - 1;

    // increment index a if lo is within padding gap
    if (lo - values[a] > bandwidth + 1e-10) ++a;

    if (reverse) t = a, a = n - b, b = n - t; // map + swap
    return (a > b) ? undefined : domain().slice(a, b+1);
  };

  scale.invert = function(_) {
    var value = scale.invertRange([_, _]);
    return value ? value[0] : value;
  };

  scale.copy = function() {
    return band()
        .domain(domain())
        .range(range$$)
        .round(round)
        .paddingInner(paddingInner)
        .paddingOuter(paddingOuter)
        .align(align);
  };

  return rescale();
}

function pointish(scale) {
  var copy = scale.copy;

  scale.padding = scale.paddingOuter;
  delete scale.paddingInner;
  delete scale.paddingOuter;

  scale.copy = function() {
    return pointish(copy());
  };

  return scale;
}

function point() {
  return pointish(band().paddingInner(1));
}

function index(scheme) {
  var domain = [],
      length = 0,
      lookup = {},
      interp = scheme ? sequential(scheme) : linear();

  function scale(_) {
    if (lookup.hasOwnProperty(_)) return interp(lookup[_]);
  }

  scale.domain = function(_) {
    if (!arguments.length) return domain.slice();
    domain = _.slice();
    length = domain.length;
    lookup = {};
    for (var i=0; i<length;) lookup[domain[i]] = i++;
    interp.domain([0, length - 1]);
    return scale;
  };

  if (!scheme) {
    // sequential scales do not export an invert method

    scale.invert = function(_) {
      return domain[interp.invert(_)];
    };

    scale.invertRange = function(_) {
      var lo = interp.invert(_[0]),
          hi = interp.invert(_[1]),
          t;

      if (lo > hi) t = lo, lo = hi, hi = t;

      t = domain.slice(
        Math.max(0, Math.ceil(lo)),
        Math.min(length, Math.floor(hi) + 1)
      );

      return t.length ? t : undefined;
    };
  }

  (scheme
    ? ['interpolator']
    : ['interpolate', 'range', 'rangeRound'])
    .forEach(function(method) {
      scale[method] = function() {
        var r = interp[method].apply(null, arguments);
        return arguments.length ? scale : r;
      };
    });

  scale.copy = function() {
    return (scheme
      ? index(scheme).interpolator(interp.interpolator())
      : index().interpolate(interp.interpolate()).range(interp.range())
    ).domain(domain);
  };

  return scale;
}

function invertRange(scale) {
  return function(_) {
    var lo = _[0],
        hi = _[1],
        t;

    if (hi < lo) t = lo, lo = hi, hi = t;

    return [
      scale.invert(lo),
      scale.invert(hi)
    ];
  }
}

function invertRangeExtent(scale) {
  return function(_) {
    var range = scale.range(),
        lo = _[0],
        hi = _[1],
        min = -1, max, t, i, n;

    if (hi < lo) t = lo, lo = hi, hi = t;

    for (i=0, n=range.length; i<n; ++i) {
      if (range[i] >= lo && range[i] <= hi) {
        if (min < 0) min = i;
        max = i;
      }
    }

    if (min < 0) return undefined;

    lo = scale.invertExtent(range[min]);
    hi = scale.invertExtent(range[max]);

    return [
      lo[0] === undefined ? lo[1] : lo[0],
      hi[1] === undefined ? hi[0] : hi[1]
    ];
  }
}

function colors$1(colors) {
  return colors.match(/.{6}/g).map(function(x) {
    return "#" + x;
  });
}

var schemeAccent = colors$1("7fc97fbeaed4fdc086ffff99386cb0f0027fbf5b17666666");

var schemeDark2 = colors$1("1b9e77d95f027570b3e7298a66a61ee6ab02a6761d666666");

var schemePaired = colors$1("a6cee31f78b4b2df8a33a02cfb9a99e31a1cfdbf6fff7f00cab2d66a3d9affff99b15928");

var schemePastel1 = colors$1("fbb4aeb3cde3ccebc5decbe4fed9a6ffffcce5d8bdfddaecf2f2f2");

var schemePastel2 = colors$1("b3e2cdfdcdaccbd5e8f4cae4e6f5c9fff2aef1e2cccccccc");

var schemeSet1 = colors$1("e41a1c377eb84daf4a984ea3ff7f00ffff33a65628f781bf999999");

var schemeSet2 = colors$1("66c2a5fc8d628da0cbe78ac3a6d854ffd92fe5c494b3b3b3");

var schemeSet3 = colors$1("8dd3c7ffffb3bebadafb807280b1d3fdb462b3de69fccde5d9d9d9bc80bdccebc5ffed6f");

function ramp$1(range) {
  return interpolateRgbBasis(colors$1(range));
}

var interpolateBrBG = ramp$1("5430058c510abf812ddfc27df6e8c3f5f5f5c7eae580cdc135978f01665e003c30");

var interpolatePRGn = ramp$1("40004b762a839970abc2a5cfe7d4e8f7f7f7d9f0d3a6dba05aae611b783700441b");

var interpolatePiYG = ramp$1("8e0152c51b7dde77aef1b6dafde0eff7f7f7e6f5d0b8e1867fbc414d9221276419");

var interpolatePuOr = ramp$1("7f3b08b35806e08214fdb863fee0b6f7f7f7d8daebb2abd28073ac5427882d004b");

var interpolateRdBu = ramp$1("67001fb2182bd6604df4a582fddbc7f7f7f7d1e5f092c5de4393c32166ac053061");

var interpolateRdGy = ramp$1("67001fb2182bd6604df4a582fddbc7ffffffe0e0e0bababa8787874d4d4d1a1a1a");

var interpolateRdYlBu = ramp$1("a50026d73027f46d43fdae61fee090ffffbfe0f3f8abd9e974add14575b4313695");

var interpolateRdYlGn = ramp$1("a50026d73027f46d43fdae61fee08bffffbfd9ef8ba6d96a66bd631a9850006837");

var interpolateSpectral = ramp$1("9e0142d53e4ff46d43fdae61fee08bffffbfe6f598abdda466c2a53288bd5e4fa2");

var interpolateBuGn = ramp$1("f7fcfde5f5f9ccece699d8c966c2a441ae76238b45006d2c00441b");

var interpolateBuPu = ramp$1("f7fcfde0ecf4bfd3e69ebcda8c96c68c6bb188419d810f7c4d004b");

var interpolateGnBu = ramp$1("f7fcf0e0f3dbccebc5a8ddb57bccc44eb3d32b8cbe0868ac084081");

var interpolateOrRd = ramp$1("fff7ecfee8c8fdd49efdbb84fc8d59ef6548d7301fb300007f0000");

var interpolatePuBuGn = ramp$1("fff7fbece2f0d0d1e6a6bddb67a9cf3690c002818a016c59014636");

var interpolatePuBu = ramp$1("fff7fbece7f2d0d1e6a6bddb74a9cf3690c00570b0045a8d023858");

var interpolatePuRd = ramp$1("f7f4f9e7e1efd4b9dac994c7df65b0e7298ace125698004367001f");

var interpolateRdPu = ramp$1("fff7f3fde0ddfcc5c0fa9fb5f768a1dd3497ae017e7a017749006a");

var interpolateYlGnBu = ramp$1("ffffd9edf8b1c7e9b47fcdbb41b6c41d91c0225ea8253494081d58");

var interpolateYlGn = ramp$1("ffffe5f7fcb9d9f0a3addd8e78c67941ab5d238443006837004529");

var interpolateYlOrBr = ramp$1("ffffe5fff7bcfee391fec44ffe9929ec7014cc4c02993404662506");

var interpolateYlOrRd = ramp$1("ffffccffeda0fed976feb24cfd8d3cfc4e2ae31a1cbd0026800026");

var interpolateBlues = ramp$1("f7fbffdeebf7c6dbef9ecae16baed64292c62171b508519c08306b");

var interpolateGreens = ramp$1("f7fcf5e5f5e0c7e9c0a1d99b74c47641ab5d238b45006d2c00441b");

var interpolateGreys = ramp$1("fffffff0f0f0d9d9d9bdbdbd969696737373525252252525000000");

var interpolatePurples = ramp$1("fcfbfdefedf5dadaebbcbddc9e9ac8807dba6a51a354278f3f007d");

var interpolateReds = ramp$1("fff5f0fee0d2fcbba1fc9272fb6a4aef3b2ccb181da50f1567000d");

var interpolateOranges = ramp$1("fff5ebfee6cefdd0a2fdae6bfd8d3cf16913d94801a636037f2704");

var schemes = {
  // d3 built-in categorical palettes
  category10:  schemeCategory10,
  category20:  schemeCategory20,
  category20b: schemeCategory20b,
  category20c: schemeCategory20c,

  // extended categorical palettes
  accent:      schemeAccent,
  dark2:       schemeDark2,
  paired:      schemePaired,
  pastel1:     schemePastel1,
  pastel2:     schemePastel2,
  set1:        schemeSet1,
  set2:        schemeSet2,
  set3:        schemeSet3,

  // d3 built-in interpolators
  cubehelix:   interpolateCubehelixDefault,
  rainbow:     interpolateRainbow,
  warm:        interpolateWarm,
  cool:        interpolateCool,
  viridis:     interpolateViridis,
  magma:       interpolateMagma,
  inferno:     interpolateInferno,
  plasma:      interpolatePlasma,

  // diverging
  brbg:        interpolateBrBG,
  prgn:        interpolatePRGn,
  piyg:        interpolatePiYG,
  puor:        interpolatePuOr,
  rdbu:        interpolateRdBu,
  rdgy:        interpolateRdGy,
  rdylbu:      interpolateRdYlBu,
  rdylgn:      interpolateRdYlGn,
  spectral:    interpolateSpectral,

  // repeat with friendlier names
  brownbluegreen:  interpolateBrBG,
  purplegreen:     interpolatePRGn,
  pinkyellowgreen: interpolatePiYG,
  purpleorange:    interpolatePuOr,
  redblue:         interpolateRdBu,
  redgrey:         interpolateRdGy,
  redyellowblue:   interpolateRdYlBu,
  redyellowgreen:  interpolateRdYlGn,

  // sequential multi-hue
  bugn:        interpolateBuGn,
  bupu:        interpolateBuPu,
  gnbu:        interpolateGnBu,
  orrd:        interpolateOrRd,
  pubugn:      interpolatePuBuGn,
  pubu:        interpolatePuBu,
  purd:        interpolatePuRd,
  rdpu:        interpolateRdPu,
  ylgnbu:      interpolateYlGnBu,
  ylgn:        interpolateYlGn,
  ylorbr:      interpolateYlOrBr,
  ylorrd:      interpolateYlOrRd,

  // repeat with friendlier names
  bluegreen:         interpolateBuGn,
  bluepurple:        interpolateBuPu,
  greenblue:         interpolateGnBu,
  orangered:         interpolateOrRd,
  purplebluegreen:   interpolatePuBuGn,
  purpleblue:        interpolatePuBu,
  purplered:         interpolatePuRd,
  redpurple:         interpolateRdPu,
  yellowgreenblue:   interpolateYlGnBu,
  yellowgreen:       interpolateYlGn,
  yelloworangebrown: interpolateYlOrBr,
  yelloworangered:   interpolateYlOrRd,

  // sequential single-hue
  blues:       interpolateBlues,
  greens:      interpolateGreens,
  greys:       interpolateGreys,
  purples:     interpolatePurples,
  reds:        interpolateReds,
  oranges:     interpolateOranges
};

function reverseInterpolator(interpolator) {
  return function(i) { return interpolator(1 - i); };
}

function getScheme(name, scheme) {
  return arguments.length > 1 ? (schemes[name] = scheme, this)
    : schemes.hasOwnProperty(name) ? schemes[name] : null;
}

/**
 * Augment scales with their type and needed inverse methods.
 */
function create(type, constructor) {
  return function scale(scheme, reverse) {
    if (scheme) {
      if (!(scheme = getScheme(scheme))) {
        error('Unrecognized scale scheme: ' + scheme)
      }
      if (reverse) {
        scheme = isFunction(scheme)
          ? reverseInterpolator(scheme)
          : scheme.slice().reverse();
      }
    }

    var s = constructor(scheme);

    s.type = type;

    if (!s.invertRange) {
      s.invertRange = s.invert ? invertRange(s)
        : s.invertExtent ? invertRangeExtent(s)
        : undefined;
    }

    return s;
  };
}

function scale(type, scale) {
  return arguments.length > 1 ? (scales[type] = create(type, scale), this)
    : scales.hasOwnProperty(type) ? scales[type] : null;
}

var scales = {
  // base scale types
  identity:    identity$2,
  linear:      linear,
  log:         log$1,
  ordinal:     ordinal,
  pow:         pow,
  sqrt:        sqrt,
  quantile:    quantile,
  quantize:    quantize$1,
  threshold:   threshold$1,
  time:        scaleTime,
  utc:         scaleUtc,
  sequential:  sequential,

  // extended scale types
  band:        band,
  point:       point,
  index:       index
};

for (var key$2 in scales) {
  scale(key$2, scales[key$2]);
}

// Adds floating point numbers with twice the normal precision.
// Reference: J. R. Shewchuk, Adaptive Precision Floating-Point Arithmetic and
// Fast Robust Geometric Predicates, Discrete & Computational Geometry 18(3)
// 305–363 (1997).
// Code adapted from GeographicLib by Charles F. F. Karney,
// http://geographiclib.sourceforge.net/

function adder() {
  return new Adder;
}

function Adder() {
  this.reset();
}

Adder.prototype = {
  constructor: Adder,
  reset: function() {
    this.s = // rounded value
    this.t = 0; // exact error
  },
  add: function(y) {
    add$1(temp, y, this.t);
    add$1(this, temp.s, this.s);
    if (this.s) this.t += temp.t;
    else this.s = temp.t;
  },
  valueOf: function() {
    return this.s;
  }
};

var temp = new Adder;

function add$1(adder, a, b) {
  var x = adder.s = a + b,
      bv = x - a,
      av = x - bv;
  adder.t = (a - av) + (b - bv);
}

var epsilon = 1e-6;
var pi = Math.PI;
var halfPi = pi / 2;
var quarterPi = pi / 4;
var tau = pi * 2;

var degrees$1 = 180 / pi;
var radians = pi / 180;

var abs = Math.abs;
var atan = Math.atan;
var atan2 = Math.atan2;
var cos = Math.cos;
var ceil = Math.ceil;
var exp = Math.exp;
var log$2 = Math.log;
var pow$1 = Math.pow;
var sin = Math.sin;
var sign = Math.sign || function(x) { return x > 0 ? 1 : x < 0 ? -1 : 0; };
var sqrt$1 = Math.sqrt;
var tan = Math.tan;

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
}

function asin(x) {
  return x > 1 ? halfPi : x < -1 ? -halfPi : Math.asin(x);
}

function noop$2() {}

function streamGeometry(geometry, stream) {
  if (geometry && streamGeometryType.hasOwnProperty(geometry.type)) {
    streamGeometryType[geometry.type](geometry, stream);
  }
}

var streamObjectType = {
  Feature: function(feature, stream) {
    streamGeometry(feature.geometry, stream);
  },
  FeatureCollection: function(object, stream) {
    var features = object.features, i = -1, n = features.length;
    while (++i < n) streamGeometry(features[i].geometry, stream);
  }
};

var streamGeometryType = {
  Sphere: function(object, stream) {
    stream.sphere();
  },
  Point: function(object, stream) {
    object = object.coordinates;
    stream.point(object[0], object[1], object[2]);
  },
  MultiPoint: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) object = coordinates[i], stream.point(object[0], object[1], object[2]);
  },
  LineString: function(object, stream) {
    streamLine(object.coordinates, stream, 0);
  },
  MultiLineString: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) streamLine(coordinates[i], stream, 0);
  },
  Polygon: function(object, stream) {
    streamPolygon(object.coordinates, stream);
  },
  MultiPolygon: function(object, stream) {
    var coordinates = object.coordinates, i = -1, n = coordinates.length;
    while (++i < n) streamPolygon(coordinates[i], stream);
  },
  GeometryCollection: function(object, stream) {
    var geometries = object.geometries, i = -1, n = geometries.length;
    while (++i < n) streamGeometry(geometries[i], stream);
  }
};

function streamLine(coordinates, stream, closed) {
  var i = -1, n = coordinates.length - closed, coordinate;
  stream.lineStart();
  while (++i < n) coordinate = coordinates[i], stream.point(coordinate[0], coordinate[1], coordinate[2]);
  stream.lineEnd();
}

function streamPolygon(coordinates, stream) {
  var i = -1, n = coordinates.length;
  stream.polygonStart();
  while (++i < n) streamLine(coordinates[i], stream, 1);
  stream.polygonEnd();
}

function geoStream(object, stream) {
  if (object && streamObjectType.hasOwnProperty(object.type)) {
    streamObjectType[object.type](object, stream);
  } else {
    streamGeometry(object, stream);
  }
}

var areaRingSum = adder();

var areaSum = adder();
var lambda00;
var phi00;
var lambda0;
var cosPhi0;
var sinPhi0;
var areaStream = {
  point: noop$2,
  lineStart: noop$2,
  lineEnd: noop$2,
  polygonStart: function() {
    areaRingSum.reset();
    areaStream.lineStart = areaRingStart;
    areaStream.lineEnd = areaRingEnd;
  },
  polygonEnd: function() {
    var areaRing = +areaRingSum;
    areaSum.add(areaRing < 0 ? tau + areaRing : areaRing);
    this.lineStart = this.lineEnd = this.point = noop$2;
  },
  sphere: function() {
    areaSum.add(tau);
  }
};

function areaRingStart() {
  areaStream.point = areaPointFirst;
}

function areaRingEnd() {
  areaPoint(lambda00, phi00);
}

function areaPointFirst(lambda, phi) {
  areaStream.point = areaPoint;
  lambda00 = lambda, phi00 = phi;
  lambda *= radians, phi *= radians;
  lambda0 = lambda, cosPhi0 = cos(phi = phi / 2 + quarterPi), sinPhi0 = sin(phi);
}

function areaPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  phi = phi / 2 + quarterPi; // half the angular distance from south pole

  // Spherical excess E for a spherical triangle with vertices: south pole,
  // previous point, current point.  Uses a formula derived from Cagnoli’s
  // theorem.  See Todhunter, Spherical Trig. (1871), Sec. 103, Eq. (2).
  var dLambda = lambda - lambda0,
      sdLambda = dLambda >= 0 ? 1 : -1,
      adLambda = sdLambda * dLambda,
      cosPhi = cos(phi),
      sinPhi = sin(phi),
      k = sinPhi0 * sinPhi,
      u = cosPhi0 * cosPhi + k * cos(adLambda),
      v = k * sdLambda * sin(adLambda);
  areaRingSum.add(atan2(v, u));

  // Advance the previous points.
  lambda0 = lambda, cosPhi0 = cosPhi, sinPhi0 = sinPhi;
}

function spherical(cartesian) {
  return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])];
}

function cartesian(spherical) {
  var lambda = spherical[0], phi = spherical[1], cosPhi = cos(phi);
  return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
}

function cartesianDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cartesianCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

// TODO return a
function cartesianAddInPlace(a, b) {
  a[0] += b[0], a[1] += b[1], a[2] += b[2];
}

function cartesianScale(vector, k) {
  return [vector[0] * k, vector[1] * k, vector[2] * k];
}

// TODO return d
function cartesianNormalizeInPlace(d) {
  var l = sqrt$1(d[0] * d[0] + d[1] * d[1] + d[2] * d[2]);
  d[0] /= l, d[1] /= l, d[2] /= l;
}

var lambda0$1;
var phi0;
var lambda1;
var phi1;
var lambda2;
var lambda00$1;
var phi00$1;
var p0;
var deltaSum = adder();
var ranges;
var range$1;
var boundsStream = {
  point: boundsPoint,
  lineStart: boundsLineStart,
  lineEnd: boundsLineEnd,
  polygonStart: function() {
    boundsStream.point = boundsRingPoint;
    boundsStream.lineStart = boundsRingStart;
    boundsStream.lineEnd = boundsRingEnd;
    deltaSum.reset();
    areaStream.polygonStart();
  },
  polygonEnd: function() {
    areaStream.polygonEnd();
    boundsStream.point = boundsPoint;
    boundsStream.lineStart = boundsLineStart;
    boundsStream.lineEnd = boundsLineEnd;
    if (areaRingSum < 0) lambda0$1 = -(lambda1 = 180), phi0 = -(phi1 = 90);
    else if (deltaSum > epsilon) phi1 = 90;
    else if (deltaSum < -epsilon) phi0 = -90;
    range$1[0] = lambda0$1, range$1[1] = lambda1;
  }
};

function boundsPoint(lambda, phi) {
  ranges.push(range$1 = [lambda0$1 = lambda, lambda1 = lambda]);
  if (phi < phi0) phi0 = phi;
  if (phi > phi1) phi1 = phi;
}

function linePoint(lambda, phi) {
  var p = cartesian([lambda * radians, phi * radians]);
  if (p0) {
    var normal = cartesianCross(p0, p),
        equatorial = [normal[1], -normal[0], 0],
        inflection = cartesianCross(equatorial, normal);
    cartesianNormalizeInPlace(inflection);
    inflection = spherical(inflection);
    var delta = lambda - lambda2,
        sign = delta > 0 ? 1 : -1,
        lambdai = inflection[0] * degrees$1 * sign,
        phii,
        antimeridian = abs(delta) > 180;
    if (antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
      phii = inflection[1] * degrees$1;
      if (phii > phi1) phi1 = phii;
    } else if (lambdai = (lambdai + 360) % 360 - 180, antimeridian ^ (sign * lambda2 < lambdai && lambdai < sign * lambda)) {
      phii = -inflection[1] * degrees$1;
      if (phii < phi0) phi0 = phii;
    } else {
      if (phi < phi0) phi0 = phi;
      if (phi > phi1) phi1 = phi;
    }
    if (antimeridian) {
      if (lambda < lambda2) {
        if (angle(lambda0$1, lambda) > angle(lambda0$1, lambda1)) lambda1 = lambda;
      } else {
        if (angle(lambda, lambda1) > angle(lambda0$1, lambda1)) lambda0$1 = lambda;
      }
    } else {
      if (lambda1 >= lambda0$1) {
        if (lambda < lambda0$1) lambda0$1 = lambda;
        if (lambda > lambda1) lambda1 = lambda;
      } else {
        if (lambda > lambda2) {
          if (angle(lambda0$1, lambda) > angle(lambda0$1, lambda1)) lambda1 = lambda;
        } else {
          if (angle(lambda, lambda1) > angle(lambda0$1, lambda1)) lambda0$1 = lambda;
        }
      }
    }
  } else {
    boundsPoint(lambda, phi);
  }
  p0 = p, lambda2 = lambda;
}

function boundsLineStart() {
  boundsStream.point = linePoint;
}

function boundsLineEnd() {
  range$1[0] = lambda0$1, range$1[1] = lambda1;
  boundsStream.point = boundsPoint;
  p0 = null;
}

function boundsRingPoint(lambda, phi) {
  if (p0) {
    var delta = lambda - lambda2;
    deltaSum.add(abs(delta) > 180 ? delta + (delta > 0 ? 360 : -360) : delta);
  } else {
    lambda00$1 = lambda, phi00$1 = phi;
  }
  areaStream.point(lambda, phi);
  linePoint(lambda, phi);
}

function boundsRingStart() {
  areaStream.lineStart();
}

function boundsRingEnd() {
  boundsRingPoint(lambda00$1, phi00$1);
  areaStream.lineEnd();
  if (abs(deltaSum) > epsilon) lambda0$1 = -(lambda1 = 180);
  range$1[0] = lambda0$1, range$1[1] = lambda1;
  p0 = null;
}

// Finds the left-right distance between two longitudes.
// This is almost the same as (lambda1 - lambda0 + 360°) % 360°, except that we want
// the distance between ±180° to be 360°.
function angle(lambda0, lambda1) {
  return (lambda1 -= lambda0) < 0 ? lambda1 + 360 : lambda1;
}

var W0;
var W1;
var X0;
var Y0;
var Z0;
var X1;
var Y1;
var Z1;
var X2;
var Y2;
var Z2;
var lambda00$2;
var phi00$2;
var x0;
var y0;
var z0;
// previous point

var centroidStream = {
  sphere: noop$2,
  point: centroidPoint,
  lineStart: centroidLineStart,
  lineEnd: centroidLineEnd,
  polygonStart: function() {
    centroidStream.lineStart = centroidRingStart;
    centroidStream.lineEnd = centroidRingEnd;
  },
  polygonEnd: function() {
    centroidStream.lineStart = centroidLineStart;
    centroidStream.lineEnd = centroidLineEnd;
  }
};

// Arithmetic mean of Cartesian vectors.
function centroidPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var cosPhi = cos(phi);
  centroidPointCartesian(cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi));
}

function centroidPointCartesian(x, y, z) {
  ++W0;
  X0 += (x - X0) / W0;
  Y0 += (y - Y0) / W0;
  Z0 += (z - Z0) / W0;
}

function centroidLineStart() {
  centroidStream.point = centroidLinePointFirst;
}

function centroidLinePointFirst(lambda, phi) {
  lambda *= radians, phi *= radians;
  var cosPhi = cos(phi);
  x0 = cosPhi * cos(lambda);
  y0 = cosPhi * sin(lambda);
  z0 = sin(phi);
  centroidStream.point = centroidLinePoint;
  centroidPointCartesian(x0, y0, z0);
}

function centroidLinePoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var cosPhi = cos(phi),
      x = cosPhi * cos(lambda),
      y = cosPhi * sin(lambda),
      z = sin(phi),
      w = atan2(sqrt$1((w = y0 * z - z0 * y) * w + (w = z0 * x - x0 * z) * w + (w = x0 * y - y0 * x) * w), x0 * x + y0 * y + z0 * z);
  W1 += w;
  X1 += w * (x0 + (x0 = x));
  Y1 += w * (y0 + (y0 = y));
  Z1 += w * (z0 + (z0 = z));
  centroidPointCartesian(x0, y0, z0);
}

function centroidLineEnd() {
  centroidStream.point = centroidPoint;
}

// See J. E. Brock, The Inertia Tensor for a Spherical Triangle,
// J. Applied Mechanics 42, 239 (1975).
function centroidRingStart() {
  centroidStream.point = centroidRingPointFirst;
}

function centroidRingEnd() {
  centroidRingPoint(lambda00$2, phi00$2);
  centroidStream.point = centroidPoint;
}

function centroidRingPointFirst(lambda, phi) {
  lambda00$2 = lambda, phi00$2 = phi;
  lambda *= radians, phi *= radians;
  centroidStream.point = centroidRingPoint;
  var cosPhi = cos(phi);
  x0 = cosPhi * cos(lambda);
  y0 = cosPhi * sin(lambda);
  z0 = sin(phi);
  centroidPointCartesian(x0, y0, z0);
}

function centroidRingPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var cosPhi = cos(phi),
      x = cosPhi * cos(lambda),
      y = cosPhi * sin(lambda),
      z = sin(phi),
      cx = y0 * z - z0 * y,
      cy = z0 * x - x0 * z,
      cz = x0 * y - y0 * x,
      m = sqrt$1(cx * cx + cy * cy + cz * cz),
      u = x0 * x + y0 * y + z0 * z,
      v = m && -acos(u) / m, // area weight
      w = atan2(m, u); // line weight
  X2 += v * cx;
  Y2 += v * cy;
  Z2 += v * cz;
  W1 += w;
  X1 += w * (x0 + (x0 = x));
  Y1 += w * (y0 + (y0 = y));
  Z1 += w * (z0 + (z0 = z));
  centroidPointCartesian(x0, y0, z0);
}

function compose(a, b) {

  function compose(x, y) {
    return x = a(x, y), b(x[0], x[1]);
  }

  if (a.invert && b.invert) compose.invert = function(x, y) {
    return x = b.invert(x, y), x && a.invert(x[0], x[1]);
  };

  return compose;
}

function rotationIdentity(lambda, phi) {
  return [lambda > pi ? lambda - tau : lambda < -pi ? lambda + tau : lambda, phi];
}

rotationIdentity.invert = rotationIdentity;

function rotateRadians(deltaLambda, deltaPhi, deltaGamma) {
  return (deltaLambda %= tau) ? (deltaPhi || deltaGamma ? compose(rotationLambda(deltaLambda), rotationPhiGamma(deltaPhi, deltaGamma))
    : rotationLambda(deltaLambda))
    : (deltaPhi || deltaGamma ? rotationPhiGamma(deltaPhi, deltaGamma)
    : rotationIdentity);
}

function forwardRotationLambda(deltaLambda) {
  return function(lambda, phi) {
    return lambda += deltaLambda, [lambda > pi ? lambda - tau : lambda < -pi ? lambda + tau : lambda, phi];
  };
}

function rotationLambda(deltaLambda) {
  var rotation = forwardRotationLambda(deltaLambda);
  rotation.invert = forwardRotationLambda(-deltaLambda);
  return rotation;
}

function rotationPhiGamma(deltaPhi, deltaGamma) {
  var cosDeltaPhi = cos(deltaPhi),
      sinDeltaPhi = sin(deltaPhi),
      cosDeltaGamma = cos(deltaGamma),
      sinDeltaGamma = sin(deltaGamma);

  function rotation(lambda, phi) {
    var cosPhi = cos(phi),
        x = cos(lambda) * cosPhi,
        y = sin(lambda) * cosPhi,
        z = sin(phi),
        k = z * cosDeltaPhi + x * sinDeltaPhi;
    return [
      atan2(y * cosDeltaGamma - k * sinDeltaGamma, x * cosDeltaPhi - z * sinDeltaPhi),
      asin(k * cosDeltaGamma + y * sinDeltaGamma)
    ];
  }

  rotation.invert = function(lambda, phi) {
    var cosPhi = cos(phi),
        x = cos(lambda) * cosPhi,
        y = sin(lambda) * cosPhi,
        z = sin(phi),
        k = z * cosDeltaGamma - y * sinDeltaGamma;
    return [
      atan2(y * cosDeltaGamma + z * sinDeltaGamma, x * cosDeltaPhi + k * sinDeltaPhi),
      asin(k * cosDeltaPhi - x * sinDeltaPhi)
    ];
  };

  return rotation;
}

// Generates a circle centered at [0°, 0°], with a given radius and precision.
function circleStream(stream, radius, delta, direction, t0, t1) {
  if (!delta) return;
  var cosRadius = cos(radius),
      sinRadius = sin(radius),
      step = direction * delta;
  if (t0 == null) {
    t0 = radius + direction * tau;
    t1 = radius - step / 2;
  } else {
    t0 = circleRadius(cosRadius, t0);
    t1 = circleRadius(cosRadius, t1);
    if (direction > 0 ? t0 < t1 : t0 > t1) t0 += direction * tau;
  }
  for (var point, t = t0; direction > 0 ? t > t1 : t < t1; t -= step) {
    point = spherical([cosRadius, -sinRadius * cos(t), -sinRadius * sin(t)]);
    stream.point(point[0], point[1]);
  }
}

// Returns the signed angle of a cartesian point relative to [cosRadius, 0, 0].
function circleRadius(cosRadius, point) {
  point = cartesian(point), point[0] -= cosRadius;
  cartesianNormalizeInPlace(point);
  var radius = acos(-point[1]);
  return ((-point[2] < 0 ? -radius : radius) + tau - epsilon) % tau;
}

function clipBuffer() {
  var lines = [],
      line;
  return {
    point: function(x, y) {
      line.push([x, y]);
    },
    lineStart: function() {
      lines.push(line = []);
    },
    lineEnd: noop$2,
    rejoin: function() {
      if (lines.length > 1) lines.push(lines.pop().concat(lines.shift()));
    },
    result: function() {
      var result = lines;
      lines = [];
      line = null;
      return result;
    }
  };
}

function clipLine(a, b, x0, y0, x1, y1) {
  var ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;

  r = x0 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dx > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = x1 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dx > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  r = y0 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dy > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = y1 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dy > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  if (t0 > 0) a[0] = ax + t0 * dx, a[1] = ay + t0 * dy;
  if (t1 < 1) b[0] = ax + t1 * dx, b[1] = ay + t1 * dy;
  return true;
}

function pointEqual(a, b) {
  return abs(a[0] - b[0]) < epsilon && abs(a[1] - b[1]) < epsilon;
}

function Intersection(point, points, other, entry) {
  this.x = point;
  this.z = points;
  this.o = other; // another intersection
  this.e = entry; // is an entry?
  this.v = false; // visited
  this.n = this.p = null; // next & previous
}

// A generalized polygon clipping algorithm: given a polygon that has been cut
// into its visible line segments, and rejoins the segments by interpolating
// along the clip edge.
function clipPolygon(segments, compareIntersection, startInside, interpolate, stream) {
  var subject = [],
      clip = [],
      i,
      n;

  segments.forEach(function(segment) {
    if ((n = segment.length - 1) <= 0) return;
    var n, p0 = segment[0], p1 = segment[n], x;

    // If the first and last points of a segment are coincident, then treat as a
    // closed ring. TODO if all rings are closed, then the winding order of the
    // exterior ring should be checked.
    if (pointEqual(p0, p1)) {
      stream.lineStart();
      for (i = 0; i < n; ++i) stream.point((p0 = segment[i])[0], p0[1]);
      stream.lineEnd();
      return;
    }

    subject.push(x = new Intersection(p0, segment, null, true));
    clip.push(x.o = new Intersection(p0, null, x, false));
    subject.push(x = new Intersection(p1, segment, null, false));
    clip.push(x.o = new Intersection(p1, null, x, true));
  });

  if (!subject.length) return;

  clip.sort(compareIntersection);
  link(subject);
  link(clip);

  for (i = 0, n = clip.length; i < n; ++i) {
    clip[i].e = startInside = !startInside;
  }

  var start = subject[0],
      points,
      point;

  while (1) {
    // Find first unvisited intersection.
    var current = start,
        isSubject = true;
    while (current.v) if ((current = current.n) === start) return;
    points = current.z;
    stream.lineStart();
    do {
      current.v = current.o.v = true;
      if (current.e) {
        if (isSubject) {
          for (i = 0, n = points.length; i < n; ++i) stream.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.x, current.n.x, 1, stream);
        }
        current = current.n;
      } else {
        if (isSubject) {
          points = current.p.z;
          for (i = points.length - 1; i >= 0; --i) stream.point((point = points[i])[0], point[1]);
        } else {
          interpolate(current.x, current.p.x, -1, stream);
        }
        current = current.p;
      }
      current = current.o;
      points = current.z;
      isSubject = !isSubject;
    } while (!current.v);
    stream.lineEnd();
  }
}

function link(array) {
  if (!(n = array.length)) return;
  var n,
      i = 0,
      a = array[0],
      b;
  while (++i < n) {
    a.n = b = array[i];
    b.p = a;
    a = b;
  }
  a.n = b = array[0];
  b.p = a;
}

var clipMax = 1e9;
var clipMin = -clipMax;
// TODO Use d3-polygon’s polygonContains here for the ring check?
// TODO Eliminate duplicate buffering in clipBuffer and polygon.push?

function clipExtent(x0, y0, x1, y1) {

  function visible(x, y) {
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  function interpolate(from, to, direction, stream) {
    var a = 0, a1 = 0;
    if (from == null
        || (a = corner(from, direction)) !== (a1 = corner(to, direction))
        || comparePoint(from, to) < 0 ^ direction > 0) {
      do stream.point(a === 0 || a === 3 ? x0 : x1, a > 1 ? y1 : y0);
      while ((a = (a + direction + 4) % 4) !== a1);
    } else {
      stream.point(to[0], to[1]);
    }
  }

  function corner(p, direction) {
    return abs(p[0] - x0) < epsilon ? direction > 0 ? 0 : 3
        : abs(p[0] - x1) < epsilon ? direction > 0 ? 2 : 1
        : abs(p[1] - y0) < epsilon ? direction > 0 ? 1 : 0
        : direction > 0 ? 3 : 2; // abs(p[1] - y1) < epsilon
  }

  function compareIntersection(a, b) {
    return comparePoint(a.x, b.x);
  }

  function comparePoint(a, b) {
    var ca = corner(a, 1),
        cb = corner(b, 1);
    return ca !== cb ? ca - cb
        : ca === 0 ? b[1] - a[1]
        : ca === 1 ? a[0] - b[0]
        : ca === 2 ? a[1] - b[1]
        : b[0] - a[0];
  }

  return function(stream) {
    var activeStream = stream,
        bufferStream = clipBuffer(),
        segments,
        polygon,
        ring,
        x__, y__, v__, // first point
        x_, y_, v_, // previous point
        first,
        clean;

    var clipStream = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: polygonStart,
      polygonEnd: polygonEnd
    };

    function point(x, y) {
      if (visible(x, y)) activeStream.point(x, y);
    }

    function polygonInside() {
      var winding = 0;

      for (var i = 0, n = polygon.length; i < n; ++i) {
        for (var ring = polygon[i], j = 1, m = ring.length, point = ring[0], a0, a1, b0 = point[0], b1 = point[1]; j < m; ++j) {
          a0 = b0, a1 = b1, point = ring[j], b0 = point[0], b1 = point[1];
          if (a1 <= y1) { if (b1 > y1 && (b0 - a0) * (y1 - a1) > (b1 - a1) * (x0 - a0)) ++winding; }
          else { if (b1 <= y1 && (b0 - a0) * (y1 - a1) < (b1 - a1) * (x0 - a0)) --winding; }
        }
      }

      return winding;
    }

    // Buffer geometry within a polygon and then clip it en masse.
    function polygonStart() {
      activeStream = bufferStream, segments = [], polygon = [], clean = true;
    }

    function polygonEnd() {
      var startInside = polygonInside(),
          cleanInside = clean && startInside,
          visible = (segments = merge(segments)).length;
      if (cleanInside || visible) {
        stream.polygonStart();
        if (cleanInside) {
          stream.lineStart();
          interpolate(null, null, 1, stream);
          stream.lineEnd();
        }
        if (visible) {
          clipPolygon(segments, compareIntersection, startInside, interpolate, stream);
        }
        stream.polygonEnd();
      }
      activeStream = stream, segments = polygon = ring = null;
    }

    function lineStart() {
      clipStream.point = linePoint;
      if (polygon) polygon.push(ring = []);
      first = true;
      v_ = false;
      x_ = y_ = NaN;
    }

    // TODO rather than special-case polygons, simply handle them separately.
    // Ideally, coincident intersection points should be jittered to avoid
    // clipping issues.
    function lineEnd() {
      if (segments) {
        linePoint(x__, y__);
        if (v__ && v_) bufferStream.rejoin();
        segments.push(bufferStream.result());
      }
      clipStream.point = point;
      if (v_) activeStream.lineEnd();
    }

    function linePoint(x, y) {
      var v = visible(x, y);
      if (polygon) ring.push([x, y]);
      if (first) {
        x__ = x, y__ = y, v__ = v;
        first = false;
        if (v) {
          activeStream.lineStart();
          activeStream.point(x, y);
        }
      } else {
        if (v && v_) activeStream.point(x, y);
        else {
          var a = [x_ = Math.max(clipMin, Math.min(clipMax, x_)), y_ = Math.max(clipMin, Math.min(clipMax, y_))],
              b = [x = Math.max(clipMin, Math.min(clipMax, x)), y = Math.max(clipMin, Math.min(clipMax, y))];
          if (clipLine(a, b, x0, y0, x1, y1)) {
            if (!v_) {
              activeStream.lineStart();
              activeStream.point(a[0], a[1]);
            }
            activeStream.point(b[0], b[1]);
            if (!v) activeStream.lineEnd();
            clean = false;
          } else if (v) {
            activeStream.lineStart();
            activeStream.point(x, y);
            clean = false;
          }
        }
      }
      x_ = x, y_ = y, v_ = v;
    }

    return clipStream;
  };
}

var lengthSum = adder();
var lambda0$2;
var sinPhi0$1;
var cosPhi0$1;
var lengthStream = {
  sphere: noop$2,
  point: noop$2,
  lineStart: lengthLineStart,
  lineEnd: noop$2,
  polygonStart: noop$2,
  polygonEnd: noop$2
};

function lengthLineStart() {
  lengthStream.point = lengthPointFirst;
  lengthStream.lineEnd = lengthLineEnd;
}

function lengthLineEnd() {
  lengthStream.point = lengthStream.lineEnd = noop$2;
}

function lengthPointFirst(lambda, phi) {
  lambda *= radians, phi *= radians;
  lambda0$2 = lambda, sinPhi0$1 = sin(phi), cosPhi0$1 = cos(phi);
  lengthStream.point = lengthPoint;
}

function lengthPoint(lambda, phi) {
  lambda *= radians, phi *= radians;
  var sinPhi = sin(phi),
      cosPhi = cos(phi),
      delta = abs(lambda - lambda0$2),
      cosDelta = cos(delta),
      sinDelta = sin(delta),
      x = cosPhi * sinDelta,
      y = cosPhi0$1 * sinPhi - sinPhi0$1 * cosPhi * cosDelta,
      z = sinPhi0$1 * sinPhi + cosPhi0$1 * cosPhi * cosDelta;
  lengthSum.add(atan2(sqrt$1(x * x + y * y), z));
  lambda0$2 = lambda, sinPhi0$1 = sinPhi, cosPhi0$1 = cosPhi;
}

function graticuleX(y0, y1, dy) {
  var y = range(y0, y1 - epsilon, dy).concat(y1);
  return function(x) { return y.map(function(y) { return [x, y]; }); };
}

function graticuleY(x0, x1, dx) {
  var x = range(x0, x1 - epsilon, dx).concat(x1);
  return function(y) { return x.map(function(x) { return [x, y]; }); };
}

function geoGraticule() {
  var x1, x0, X1, X0,
      y1, y0, Y1, Y0,
      dx = 10, dy = dx, DX = 90, DY = 360,
      x, y, X, Y,
      precision = 2.5;

  function graticule() {
    return {type: "MultiLineString", coordinates: lines()};
  }

  function lines() {
    return range(ceil(X0 / DX) * DX, X1, DX).map(X)
        .concat(range(ceil(Y0 / DY) * DY, Y1, DY).map(Y))
        .concat(range(ceil(x0 / dx) * dx, x1, dx).filter(function(x) { return abs(x % DX) > epsilon; }).map(x))
        .concat(range(ceil(y0 / dy) * dy, y1, dy).filter(function(y) { return abs(y % DY) > epsilon; }).map(y));
  }

  graticule.lines = function() {
    return lines().map(function(coordinates) { return {type: "LineString", coordinates: coordinates}; });
  };

  graticule.outline = function() {
    return {
      type: "Polygon",
      coordinates: [
        X(X0).concat(
        Y(Y1).slice(1),
        X(X1).reverse().slice(1),
        Y(Y0).reverse().slice(1))
      ]
    };
  };

  graticule.extent = function(_) {
    if (!arguments.length) return graticule.extentMinor();
    return graticule.extentMajor(_).extentMinor(_);
  };

  graticule.extentMajor = function(_) {
    if (!arguments.length) return [[X0, Y0], [X1, Y1]];
    X0 = +_[0][0], X1 = +_[1][0];
    Y0 = +_[0][1], Y1 = +_[1][1];
    if (X0 > X1) _ = X0, X0 = X1, X1 = _;
    if (Y0 > Y1) _ = Y0, Y0 = Y1, Y1 = _;
    return graticule.precision(precision);
  };

  graticule.extentMinor = function(_) {
    if (!arguments.length) return [[x0, y0], [x1, y1]];
    x0 = +_[0][0], x1 = +_[1][0];
    y0 = +_[0][1], y1 = +_[1][1];
    if (x0 > x1) _ = x0, x0 = x1, x1 = _;
    if (y0 > y1) _ = y0, y0 = y1, y1 = _;
    return graticule.precision(precision);
  };

  graticule.step = function(_) {
    if (!arguments.length) return graticule.stepMinor();
    return graticule.stepMajor(_).stepMinor(_);
  };

  graticule.stepMajor = function(_) {
    if (!arguments.length) return [DX, DY];
    DX = +_[0], DY = +_[1];
    return graticule;
  };

  graticule.stepMinor = function(_) {
    if (!arguments.length) return [dx, dy];
    dx = +_[0], dy = +_[1];
    return graticule;
  };

  graticule.precision = function(_) {
    if (!arguments.length) return precision;
    precision = +_;
    x = graticuleX(y0, y1, 90);
    y = graticuleY(x0, x1, precision);
    X = graticuleX(Y0, Y1, 90);
    Y = graticuleY(X0, X1, precision);
    return graticule;
  };

  return graticule
      .extentMajor([[-180, -90 + epsilon], [180, 90 - epsilon]])
      .extentMinor([[-180, -80 - epsilon], [180, 80 + epsilon]]);
}

function identity$5(x) {
  return x;
}

var areaSum$1 = adder();
var areaRingSum$1 = adder();
var x00;
var y00;
var x0$1;
var y0$1;
var areaStream$1 = {
  point: noop$2,
  lineStart: noop$2,
  lineEnd: noop$2,
  polygonStart: function() {
    areaStream$1.lineStart = areaRingStart$1;
    areaStream$1.lineEnd = areaRingEnd$1;
  },
  polygonEnd: function() {
    areaStream$1.lineStart = areaStream$1.lineEnd = areaStream$1.point = noop$2;
    areaSum$1.add(abs(areaRingSum$1));
    areaRingSum$1.reset();
  },
  result: function() {
    var area = areaSum$1 / 2;
    areaSum$1.reset();
    return area;
  }
};

function areaRingStart$1() {
  areaStream$1.point = areaPointFirst$1;
}

function areaPointFirst$1(x, y) {
  areaStream$1.point = areaPoint$1;
  x00 = x0$1 = x, y00 = y0$1 = y;
}

function areaPoint$1(x, y) {
  areaRingSum$1.add(y0$1 * x - x0$1 * y);
  x0$1 = x, y0$1 = y;
}

function areaRingEnd$1() {
  areaPoint$1(x00, y00);
}

var x0$2 = Infinity;
var y0$2 = x0$2;
var x1 = -x0$2;
var y1 = x1;
var boundsStream$1 = {
  point: boundsPoint$1,
  lineStart: noop$2,
  lineEnd: noop$2,
  polygonStart: noop$2,
  polygonEnd: noop$2,
  result: function() {
    var bounds = [[x0$2, y0$2], [x1, y1]];
    x1 = y1 = -(y0$2 = x0$2 = Infinity);
    return bounds;
  }
};

function boundsPoint$1(x, y) {
  if (x < x0$2) x0$2 = x;
  if (x > x1) x1 = x;
  if (y < y0$2) y0$2 = y;
  if (y > y1) y1 = y;
}

var X0$1 = 0;
var Y0$1 = 0;
var Z0$1 = 0;
var X1$1 = 0;
var Y1$1 = 0;
var Z1$1 = 0;
var X2$1 = 0;
var Y2$1 = 0;
var Z2$1 = 0;
var x00$1;
var y00$1;
var x0$3;
var y0$3;
var centroidStream$1 = {
  point: centroidPoint$1,
  lineStart: centroidLineStart$1,
  lineEnd: centroidLineEnd$1,
  polygonStart: function() {
    centroidStream$1.lineStart = centroidRingStart$1;
    centroidStream$1.lineEnd = centroidRingEnd$1;
  },
  polygonEnd: function() {
    centroidStream$1.point = centroidPoint$1;
    centroidStream$1.lineStart = centroidLineStart$1;
    centroidStream$1.lineEnd = centroidLineEnd$1;
  },
  result: function() {
    var centroid = Z2$1 ? [X2$1 / Z2$1, Y2$1 / Z2$1]
        : Z1$1 ? [X1$1 / Z1$1, Y1$1 / Z1$1]
        : Z0$1 ? [X0$1 / Z0$1, Y0$1 / Z0$1]
        : [NaN, NaN];
    X0$1 = Y0$1 = Z0$1 =
    X1$1 = Y1$1 = Z1$1 =
    X2$1 = Y2$1 = Z2$1 = 0;
    return centroid;
  }
};

function centroidPoint$1(x, y) {
  X0$1 += x;
  Y0$1 += y;
  ++Z0$1;
}

function centroidLineStart$1() {
  centroidStream$1.point = centroidPointFirstLine;
}

function centroidPointFirstLine(x, y) {
  centroidStream$1.point = centroidPointLine;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function centroidPointLine(x, y) {
  var dx = x - x0$3, dy = y - y0$3, z = sqrt$1(dx * dx + dy * dy);
  X1$1 += z * (x0$3 + x) / 2;
  Y1$1 += z * (y0$3 + y) / 2;
  Z1$1 += z;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function centroidLineEnd$1() {
  centroidStream$1.point = centroidPoint$1;
}

function centroidRingStart$1() {
  centroidStream$1.point = centroidPointFirstRing;
}

function centroidRingEnd$1() {
  centroidPointRing(x00$1, y00$1);
}

function centroidPointFirstRing(x, y) {
  centroidStream$1.point = centroidPointRing;
  centroidPoint$1(x00$1 = x0$3 = x, y00$1 = y0$3 = y);
}

function centroidPointRing(x, y) {
  var dx = x - x0$3,
      dy = y - y0$3,
      z = sqrt$1(dx * dx + dy * dy);

  X1$1 += z * (x0$3 + x) / 2;
  Y1$1 += z * (y0$3 + y) / 2;
  Z1$1 += z;

  z = y0$3 * x - x0$3 * y;
  X2$1 += z * (x0$3 + x);
  Y2$1 += z * (y0$3 + y);
  Z2$1 += z * 3;
  centroidPoint$1(x0$3 = x, y0$3 = y);
}

function PathContext(context) {
  this._context = context;
}

PathContext.prototype = {
  _radius: 4.5,
  pointRadius: function(_) {
    return this._radius = _, this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line === 0) this._context.closePath();
    this._point = NaN;
  },
  point: function(x, y) {
    switch (this._point) {
      case 0: {
        this._context.moveTo(x, y);
        this._point = 1;
        break;
      }
      case 1: {
        this._context.lineTo(x, y);
        break;
      }
      default: {
        this._context.moveTo(x + this._radius, y);
        this._context.arc(x, y, this._radius, 0, tau);
        break;
      }
    }
  },
  result: noop$2
};

function PathString() {
  this._string = [];
}

PathString.prototype = {
  _circle: circle$1(4.5),
  pointRadius: function(_) {
    return this._circle = circle$1(_), this;
  },
  polygonStart: function() {
    this._line = 0;
  },
  polygonEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line === 0) this._string.push("Z");
    this._point = NaN;
  },
  point: function(x, y) {
    switch (this._point) {
      case 0: {
        this._string.push("M", x, ",", y);
        this._point = 1;
        break;
      }
      case 1: {
        this._string.push("L", x, ",", y);
        break;
      }
      default: {
        this._string.push("M", x, ",", y, this._circle);
        break;
      }
    }
  },
  result: function() {
    if (this._string.length) {
      var result = this._string.join("");
      this._string = [];
      return result;
    }
  }
};

function circle$1(radius) {
  return "m0," + radius
      + "a" + radius + "," + radius + " 0 1,1 0," + -2 * radius
      + "a" + radius + "," + radius + " 0 1,1 0," + 2 * radius
      + "z";
}

function geoPath() {
  var pointRadius = 4.5,
      projection,
      projectionStream,
      context,
      contextStream;

  function path(object) {
    if (object) {
      if (typeof pointRadius === "function") contextStream.pointRadius(+pointRadius.apply(this, arguments));
      geoStream(object, projectionStream(contextStream));
    }
    return contextStream.result();
  }

  path.area = function(object) {
    geoStream(object, projectionStream(areaStream$1));
    return areaStream$1.result();
  };

  path.bounds = function(object) {
    geoStream(object, projectionStream(boundsStream$1));
    return boundsStream$1.result();
  };

  path.centroid = function(object) {
    geoStream(object, projectionStream(centroidStream$1));
    return centroidStream$1.result();
  };

  path.projection = function(_) {
    return arguments.length ? (projectionStream = (projection = _) == null ? identity$5 : _.stream, path) : projection;
  };

  path.context = function(_) {
    if (!arguments.length) return context;
    contextStream = (context = _) == null ? new PathString : new PathContext(_);
    if (typeof pointRadius !== "function") contextStream.pointRadius(pointRadius);
    return path;
  };

  path.pointRadius = function(_) {
    if (!arguments.length) return pointRadius;
    pointRadius = typeof _ === "function" ? _ : (contextStream.pointRadius(+_), +_);
    return path;
  };

  return path.projection(null).context(null);
}

var sum$1 = adder();

function polygonContains(polygon, point) {
  var lambda = point[0],
      phi = point[1],
      normal = [sin(lambda), -cos(lambda), 0],
      angle = 0,
      winding = 0;

  sum$1.reset();

  for (var i = 0, n = polygon.length; i < n; ++i) {
    if (!(m = (ring = polygon[i]).length)) continue;
    var ring,
        m,
        point0 = ring[m - 1],
        lambda0 = point0[0],
        phi0 = point0[1] / 2 + quarterPi,
        sinPhi0 = sin(phi0),
        cosPhi0 = cos(phi0);

    for (var j = 0; j < m; ++j, lambda0 = lambda1, sinPhi0 = sinPhi1, cosPhi0 = cosPhi1, point0 = point1) {
      var point1 = ring[j],
          lambda1 = point1[0],
          phi1 = point1[1] / 2 + quarterPi,
          sinPhi1 = sin(phi1),
          cosPhi1 = cos(phi1),
          delta = lambda1 - lambda0,
          sign = delta >= 0 ? 1 : -1,
          absDelta = sign * delta,
          antimeridian = absDelta > pi,
          k = sinPhi0 * sinPhi1;

      sum$1.add(atan2(k * sign * sin(absDelta), cosPhi0 * cosPhi1 + k * cos(absDelta)));
      angle += antimeridian ? delta + sign * tau : delta;

      // Are the longitudes either side of the point’s meridian (lambda),
      // and are the latitudes smaller than the parallel (phi)?
      if (antimeridian ^ lambda0 >= lambda ^ lambda1 >= lambda) {
        var arc = cartesianCross(cartesian(point0), cartesian(point1));
        cartesianNormalizeInPlace(arc);
        var intersection = cartesianCross(normal, arc);
        cartesianNormalizeInPlace(intersection);
        var phiArc = (antimeridian ^ delta >= 0 ? -1 : 1) * asin(intersection[2]);
        if (phi > phiArc || phi === phiArc && (arc[0] || arc[1])) {
          winding += antimeridian ^ delta >= 0 ? 1 : -1;
        }
      }
    }
  }

  // First, determine whether the South pole is inside or outside:
  //
  // It is inside if:
  // * the polygon winds around it in a clockwise direction.
  // * the polygon does not (cumulatively) wind around it, but has a negative
  //   (counter-clockwise) area.
  //
  // Second, count the (signed) number of times a segment crosses a lambda
  // from the point to the South pole.  If it is zero, then the point is the
  // same side as the South pole.

  return (angle < -epsilon || angle < epsilon && sum$1 < -epsilon) ^ (winding & 1);
}

function clip(pointVisible, clipLine, interpolate, start) {
  return function(rotate, sink) {
    var line = clipLine(sink),
        rotatedStart = rotate.invert(start[0], start[1]),
        ringBuffer = clipBuffer(),
        ringSink = clipLine(ringBuffer),
        polygonStarted = false,
        polygon,
        segments,
        ring;

    var clip = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() {
        clip.point = pointRing;
        clip.lineStart = ringStart;
        clip.lineEnd = ringEnd;
        segments = [];
        polygon = [];
      },
      polygonEnd: function() {
        clip.point = point;
        clip.lineStart = lineStart;
        clip.lineEnd = lineEnd;
        segments = merge(segments);
        var startInside = polygonContains(polygon, rotatedStart);
        if (segments.length) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          clipPolygon(segments, compareIntersection, startInside, interpolate, sink);
        } else if (startInside) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          interpolate(null, null, 1, sink);
          sink.lineEnd();
        }
        if (polygonStarted) sink.polygonEnd(), polygonStarted = false;
        segments = polygon = null;
      },
      sphere: function() {
        sink.polygonStart();
        sink.lineStart();
        interpolate(null, null, 1, sink);
        sink.lineEnd();
        sink.polygonEnd();
      }
    };

    function point(lambda, phi) {
      var point = rotate(lambda, phi);
      if (pointVisible(lambda = point[0], phi = point[1])) sink.point(lambda, phi);
    }

    function pointLine(lambda, phi) {
      var point = rotate(lambda, phi);
      line.point(point[0], point[1]);
    }

    function lineStart() {
      clip.point = pointLine;
      line.lineStart();
    }

    function lineEnd() {
      clip.point = point;
      line.lineEnd();
    }

    function pointRing(lambda, phi) {
      ring.push([lambda, phi]);
      var point = rotate(lambda, phi);
      ringSink.point(point[0], point[1]);
    }

    function ringStart() {
      ringSink.lineStart();
      ring = [];
    }

    function ringEnd() {
      pointRing(ring[0][0], ring[0][1]);
      ringSink.lineEnd();

      var clean = ringSink.clean(),
          ringSegments = ringBuffer.result(),
          i, n = ringSegments.length, m,
          segment,
          point;

      ring.pop();
      polygon.push(ring);
      ring = null;

      if (!n) return;

      // No intersections.
      if (clean & 1) {
        segment = ringSegments[0];
        if ((m = segment.length - 1) > 0) {
          if (!polygonStarted) sink.polygonStart(), polygonStarted = true;
          sink.lineStart();
          for (i = 0; i < m; ++i) sink.point((point = segment[i])[0], point[1]);
          sink.lineEnd();
        }
        return;
      }

      // Rejoin connected segments.
      // TODO reuse ringBuffer.rejoin()?
      if (n > 1 && clean & 2) ringSegments.push(ringSegments.pop().concat(ringSegments.shift()));

      segments.push(ringSegments.filter(validSegment));
    }

    return clip;
  };
}

function validSegment(segment) {
  return segment.length > 1;
}

// Intersections are sorted along the clip edge. For both antimeridian cutting
// and circle clipping, the same comparison is used.
function compareIntersection(a, b) {
  return ((a = a.x)[0] < 0 ? a[1] - halfPi - epsilon : halfPi - a[1])
       - ((b = b.x)[0] < 0 ? b[1] - halfPi - epsilon : halfPi - b[1]);
}

var clipAntimeridian = clip(
  function() { return true; },
  clipAntimeridianLine,
  clipAntimeridianInterpolate,
  [-pi, -halfPi]
);

// Takes a line and cuts into visible segments. Return values: 0 - there were
// intersections or the line was empty; 1 - no intersections; 2 - there were
// intersections, and the first and last segments should be rejoined.
function clipAntimeridianLine(stream) {
  var lambda0 = NaN,
      phi0 = NaN,
      sign0 = NaN,
      clean; // no intersections

  return {
    lineStart: function() {
      stream.lineStart();
      clean = 1;
    },
    point: function(lambda1, phi1) {
      var sign1 = lambda1 > 0 ? pi : -pi,
          delta = abs(lambda1 - lambda0);
      if (abs(delta - pi) < epsilon) { // line crosses a pole
        stream.point(lambda0, phi0 = (phi0 + phi1) / 2 > 0 ? halfPi : -halfPi);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        stream.point(lambda1, phi0);
        clean = 0;
      } else if (sign0 !== sign1 && delta >= pi) { // line crosses antimeridian
        if (abs(lambda0 - sign0) < epsilon) lambda0 -= sign0 * epsilon; // handle degeneracies
        if (abs(lambda1 - sign1) < epsilon) lambda1 -= sign1 * epsilon;
        phi0 = clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1);
        stream.point(sign0, phi0);
        stream.lineEnd();
        stream.lineStart();
        stream.point(sign1, phi0);
        clean = 0;
      }
      stream.point(lambda0 = lambda1, phi0 = phi1);
      sign0 = sign1;
    },
    lineEnd: function() {
      stream.lineEnd();
      lambda0 = phi0 = NaN;
    },
    clean: function() {
      return 2 - clean; // if intersections, rejoin first and last segments
    }
  };
}

function clipAntimeridianIntersect(lambda0, phi0, lambda1, phi1) {
  var cosPhi0,
      cosPhi1,
      sinLambda0Lambda1 = sin(lambda0 - lambda1);
  return abs(sinLambda0Lambda1) > epsilon
      ? atan((sin(phi0) * (cosPhi1 = cos(phi1)) * sin(lambda1)
          - sin(phi1) * (cosPhi0 = cos(phi0)) * sin(lambda0))
          / (cosPhi0 * cosPhi1 * sinLambda0Lambda1))
      : (phi0 + phi1) / 2;
}

function clipAntimeridianInterpolate(from, to, direction, stream) {
  var phi;
  if (from == null) {
    phi = direction * halfPi;
    stream.point(-pi, phi);
    stream.point(0, phi);
    stream.point(pi, phi);
    stream.point(pi, 0);
    stream.point(pi, -phi);
    stream.point(0, -phi);
    stream.point(-pi, -phi);
    stream.point(-pi, 0);
    stream.point(-pi, phi);
  } else if (abs(from[0] - to[0]) > epsilon) {
    var lambda = from[0] < to[0] ? pi : -pi;
    phi = direction * lambda / 2;
    stream.point(-lambda, phi);
    stream.point(0, phi);
    stream.point(lambda, phi);
  } else {
    stream.point(to[0], to[1]);
  }
}

function clipCircle(radius, delta) {
  var cr = cos(radius),
      smallRadius = cr > 0,
      notHemisphere = abs(cr) > epsilon; // TODO optimise for this common case

  function interpolate(from, to, direction, stream) {
    circleStream(stream, radius, delta, direction, from, to);
  }

  function visible(lambda, phi) {
    return cos(lambda) * cos(phi) > cr;
  }

  // Takes a line and cuts into visible segments. Return values used for polygon
  // clipping: 0 - there were intersections or the line was empty; 1 - no
  // intersections 2 - there were intersections, and the first and last segments
  // should be rejoined.
  function clipLine(stream) {
    var point0, // previous point
        c0, // code for previous point
        v0, // visibility of previous point
        v00, // visibility of first point
        clean; // no intersections
    return {
      lineStart: function() {
        v00 = v0 = false;
        clean = 1;
      },
      point: function(lambda, phi) {
        var point1 = [lambda, phi],
            point2,
            v = visible(lambda, phi),
            c = smallRadius
              ? v ? 0 : code(lambda, phi)
              : v ? code(lambda + (lambda < 0 ? pi : -pi), phi) : 0;
        if (!point0 && (v00 = v0 = v)) stream.lineStart();
        // Handle degeneracies.
        // TODO ignore if not clipping polygons.
        if (v !== v0) {
          point2 = intersect(point0, point1);
          if (pointEqual(point0, point2) || pointEqual(point1, point2)) {
            point1[0] += epsilon;
            point1[1] += epsilon;
            v = visible(point1[0], point1[1]);
          }
        }
        if (v !== v0) {
          clean = 0;
          if (v) {
            // outside going in
            stream.lineStart();
            point2 = intersect(point1, point0);
            stream.point(point2[0], point2[1]);
          } else {
            // inside going out
            point2 = intersect(point0, point1);
            stream.point(point2[0], point2[1]);
            stream.lineEnd();
          }
          point0 = point2;
        } else if (notHemisphere && point0 && smallRadius ^ v) {
          var t;
          // If the codes for two points are different, or are both zero,
          // and there this segment intersects with the small circle.
          if (!(c & c0) && (t = intersect(point1, point0, true))) {
            clean = 0;
            if (smallRadius) {
              stream.lineStart();
              stream.point(t[0][0], t[0][1]);
              stream.point(t[1][0], t[1][1]);
              stream.lineEnd();
            } else {
              stream.point(t[1][0], t[1][1]);
              stream.lineEnd();
              stream.lineStart();
              stream.point(t[0][0], t[0][1]);
            }
          }
        }
        if (v && (!point0 || !pointEqual(point0, point1))) {
          stream.point(point1[0], point1[1]);
        }
        point0 = point1, v0 = v, c0 = c;
      },
      lineEnd: function() {
        if (v0) stream.lineEnd();
        point0 = null;
      },
      // Rejoin first and last segments if there were intersections and the first
      // and last points were visible.
      clean: function() {
        return clean | ((v00 && v0) << 1);
      }
    };
  }

  // Intersects the great circle between a and b with the clip circle.
  function intersect(a, b, two) {
    var pa = cartesian(a),
        pb = cartesian(b);

    // We have two planes, n1.p = d1 and n2.p = d2.
    // Find intersection line p(t) = c1 n1 + c2 n2 + t (n1 ⨯ n2).
    var n1 = [1, 0, 0], // normal
        n2 = cartesianCross(pa, pb),
        n2n2 = cartesianDot(n2, n2),
        n1n2 = n2[0], // cartesianDot(n1, n2),
        determinant = n2n2 - n1n2 * n1n2;

    // Two polar points.
    if (!determinant) return !two && a;

    var c1 =  cr * n2n2 / determinant,
        c2 = -cr * n1n2 / determinant,
        n1xn2 = cartesianCross(n1, n2),
        A = cartesianScale(n1, c1),
        B = cartesianScale(n2, c2);
    cartesianAddInPlace(A, B);

    // Solve |p(t)|^2 = 1.
    var u = n1xn2,
        w = cartesianDot(A, u),
        uu = cartesianDot(u, u),
        t2 = w * w - uu * (cartesianDot(A, A) - 1);

    if (t2 < 0) return;

    var t = sqrt$1(t2),
        q = cartesianScale(u, (-w - t) / uu);
    cartesianAddInPlace(q, A);
    q = spherical(q);

    if (!two) return q;

    // Two intersection points.
    var lambda0 = a[0],
        lambda1 = b[0],
        phi0 = a[1],
        phi1 = b[1],
        z;

    if (lambda1 < lambda0) z = lambda0, lambda0 = lambda1, lambda1 = z;

    var delta = lambda1 - lambda0,
        polar = abs(delta - pi) < epsilon,
        meridian = polar || delta < epsilon;

    if (!polar && phi1 < phi0) z = phi0, phi0 = phi1, phi1 = z;

    // Check that the first point is between a and b.
    if (meridian
        ? polar
          ? phi0 + phi1 > 0 ^ q[1] < (abs(q[0] - lambda0) < epsilon ? phi0 : phi1)
          : phi0 <= q[1] && q[1] <= phi1
        : delta > pi ^ (lambda0 <= q[0] && q[0] <= lambda1)) {
      var q1 = cartesianScale(u, (-w + t) / uu);
      cartesianAddInPlace(q1, A);
      return [q, spherical(q1)];
    }
  }

  // Generates a 4-bit vector representing the location of a point relative to
  // the small circle's bounding box.
  function code(lambda, phi) {
    var r = smallRadius ? radius : pi - radius,
        code = 0;
    if (lambda < -r) code |= 1; // left
    else if (lambda > r) code |= 2; // right
    if (phi < -r) code |= 4; // below
    else if (phi > r) code |= 8; // above
    return code;
  }

  return clip(visible, clipLine, interpolate, smallRadius ? [0, -radius] : [-pi, radius - pi]);
}

function transform$2(prototype) {
  function T() {}
  var p = T.prototype = Object.create(Transform$1.prototype);
  for (var k in prototype) p[k] = prototype[k];
  return function(stream) {
    var t = new T;
    t.stream = stream;
    return t;
  };
}

function Transform$1() {}

Transform$1.prototype = {
  point: function(x, y) { this.stream.point(x, y); },
  sphere: function() { this.stream.sphere(); },
  lineStart: function() { this.stream.lineStart(); },
  lineEnd: function() { this.stream.lineEnd(); },
  polygonStart: function() { this.stream.polygonStart(); },
  polygonEnd: function() { this.stream.polygonEnd(); }
};

function fit(project, extent, object) {
  var w = extent[1][0] - extent[0][0],
      h = extent[1][1] - extent[0][1],
      clip = project.clipExtent && project.clipExtent();

  project
      .scale(150)
      .translate([0, 0]);

  if (clip != null) project.clipExtent(null);

  geoStream(object, project.stream(boundsStream$1));

  var b = boundsStream$1.result(),
      k = Math.min(w / (b[1][0] - b[0][0]), h / (b[1][1] - b[0][1])),
      x = +extent[0][0] + (w - k * (b[1][0] + b[0][0])) / 2,
      y = +extent[0][1] + (h - k * (b[1][1] + b[0][1])) / 2;

  if (clip != null) project.clipExtent(clip);

  return project
      .scale(k * 150)
      .translate([x, y]);
}

function fitSize(project) {
  return function(size, object) {
    return fit(project, [[0, 0], size], object);
  };
}

function fitExtent(project) {
  return function(extent, object) {
    return fit(project, extent, object);
  };
}

var maxDepth = 16;
var cosMinDistance = cos(30 * radians);
// cos(minimum angular distance)

function resample(project, delta2) {
  return +delta2 ? resample$1(project, delta2) : resampleNone(project);
}

function resampleNone(project) {
  return transform$2({
    point: function(x, y) {
      x = project(x, y);
      this.stream.point(x[0], x[1]);
    }
  });
}

function resample$1(project, delta2) {

  function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
    var dx = x1 - x0,
        dy = y1 - y0,
        d2 = dx * dx + dy * dy;
    if (d2 > 4 * delta2 && depth--) {
      var a = a0 + a1,
          b = b0 + b1,
          c = c0 + c1,
          m = sqrt$1(a * a + b * b + c * c),
          phi2 = asin(c /= m),
          lambda2 = abs(abs(c) - 1) < epsilon || abs(lambda0 - lambda1) < epsilon ? (lambda0 + lambda1) / 2 : atan2(b, a),
          p = project(lambda2, phi2),
          x2 = p[0],
          y2 = p[1],
          dx2 = x2 - x0,
          dy2 = y2 - y0,
          dz = dy * dx2 - dx * dy2;
      if (dz * dz / d2 > delta2 // perpendicular projected distance
          || abs((dx * dx2 + dy * dy2) / d2 - 0.5) > 0.3 // midpoint close to an end
          || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, x2, y2, lambda2, a /= m, b /= m, c, depth, stream);
        stream.point(x2, y2);
        resampleLineTo(x2, y2, lambda2, a, b, c, x1, y1, lambda1, a1, b1, c1, depth, stream);
      }
    }
  }
  return function(stream) {
    var lambda00, x00, y00, a00, b00, c00, // first point
        lambda0, x0, y0, a0, b0, c0; // previous point

    var resampleStream = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() { stream.polygonStart(); resampleStream.lineStart = ringStart; },
      polygonEnd: function() { stream.polygonEnd(); resampleStream.lineStart = lineStart; }
    };

    function point(x, y) {
      x = project(x, y);
      stream.point(x[0], x[1]);
    }

    function lineStart() {
      x0 = NaN;
      resampleStream.point = linePoint;
      stream.lineStart();
    }

    function linePoint(lambda, phi) {
      var c = cartesian([lambda, phi]), p = project(lambda, phi);
      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
      stream.point(x0, y0);
    }

    function lineEnd() {
      resampleStream.point = point;
      stream.lineEnd();
    }

    function ringStart() {
      lineStart();
      resampleStream.point = ringPoint;
      resampleStream.lineEnd = ringEnd;
    }

    function ringPoint(lambda, phi) {
      linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
      resampleStream.point = linePoint;
    }

    function ringEnd() {
      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
      resampleStream.lineEnd = lineEnd;
      lineEnd();
    }

    return resampleStream;
  };
}

var transformRadians = transform$2({
  point: function(x, y) {
    this.stream.point(x * radians, y * radians);
  }
});

function projection(project) {
  return projectionMutator(function() { return project; })();
}

function projectionMutator(projectAt) {
  var project,
      k = 150, // scale
      x = 480, y = 250, // translate
      dx, dy, lambda = 0, phi = 0, // center
      deltaLambda = 0, deltaPhi = 0, deltaGamma = 0, rotate, projectRotate, // rotate
      theta = null, preclip = clipAntimeridian, // clip angle
      x0 = null, y0, x1, y1, postclip = identity$5, // clip extent
      delta2 = 0.5, projectResample = resample(projectTransform, delta2), // precision
      cache,
      cacheStream;

  function projection(point) {
    point = projectRotate(point[0] * radians, point[1] * radians);
    return [point[0] * k + dx, dy - point[1] * k];
  }

  function invert(point) {
    point = projectRotate.invert((point[0] - dx) / k, (dy - point[1]) / k);
    return point && [point[0] * degrees$1, point[1] * degrees$1];
  }

  function projectTransform(x, y) {
    return x = project(x, y), [x[0] * k + dx, dy - x[1] * k];
  }

  projection.stream = function(stream) {
    return cache && cacheStream === stream ? cache : cache = transformRadians(preclip(rotate, projectResample(postclip(cacheStream = stream))));
  };

  projection.clipAngle = function(_) {
    return arguments.length ? (preclip = +_ ? clipCircle(theta = _ * radians, 6 * radians) : (theta = null, clipAntimeridian), reset()) : theta * degrees$1;
  };

  projection.clipExtent = function(_) {
    return arguments.length ? (postclip = _ == null ? (x0 = y0 = x1 = y1 = null, identity$5) : clipExtent(x0 = +_[0][0], y0 = +_[0][1], x1 = +_[1][0], y1 = +_[1][1]), reset()) : x0 == null ? null : [[x0, y0], [x1, y1]];
  };

  projection.scale = function(_) {
    return arguments.length ? (k = +_, recenter()) : k;
  };

  projection.translate = function(_) {
    return arguments.length ? (x = +_[0], y = +_[1], recenter()) : [x, y];
  };

  projection.center = function(_) {
    return arguments.length ? (lambda = _[0] % 360 * radians, phi = _[1] % 360 * radians, recenter()) : [lambda * degrees$1, phi * degrees$1];
  };

  projection.rotate = function(_) {
    return arguments.length ? (deltaLambda = _[0] % 360 * radians, deltaPhi = _[1] % 360 * radians, deltaGamma = _.length > 2 ? _[2] % 360 * radians : 0, recenter()) : [deltaLambda * degrees$1, deltaPhi * degrees$1, deltaGamma * degrees$1];
  };

  projection.precision = function(_) {
    return arguments.length ? (projectResample = resample(projectTransform, delta2 = _ * _), reset()) : sqrt$1(delta2);
  };

  projection.fitExtent = fitExtent(projection);

  projection.fitSize = fitSize(projection);

  function recenter() {
    projectRotate = compose(rotate = rotateRadians(deltaLambda, deltaPhi, deltaGamma), project);
    var center = project(lambda, phi);
    dx = x - center[0] * k;
    dy = y + center[1] * k;
    return reset();
  }

  function reset() {
    cache = cacheStream = null;
    return projection;
  }

  return function() {
    project = projectAt.apply(this, arguments);
    projection.invert = project.invert && invert;
    return recenter();
  };
}

function conicProjection(projectAt) {
  var phi0 = 0,
      phi1 = pi / 3,
      m = projectionMutator(projectAt),
      p = m(phi0, phi1);

  p.parallels = function(_) {
    return arguments.length ? m(phi0 = _[0] * radians, phi1 = _[1] * radians) : [phi0 * degrees$1, phi1 * degrees$1];
  };

  return p;
}

function cylindricalEqualAreaRaw(phi0) {
  var cosPhi0 = cos(phi0);

  function forward(lambda, phi) {
    return [lambda * cosPhi0, sin(phi) / cosPhi0];
  }

  forward.invert = function(x, y) {
    return [x / cosPhi0, asin(y * cosPhi0)];
  };

  return forward;
}

function conicEqualAreaRaw(y0, y1) {
  var sy0 = sin(y0), n = (sy0 + sin(y1)) / 2;

  // Are the parallels symmetrical around the Equator?
  if (abs(n) < epsilon) return cylindricalEqualAreaRaw(y0);

  var c = 1 + sy0 * (2 * n - sy0), r0 = sqrt$1(c) / n;

  function project(x, y) {
    var r = sqrt$1(c - 2 * n * sin(y)) / n;
    return [r * sin(x *= n), r0 - r * cos(x)];
  }

  project.invert = function(x, y) {
    var r0y = r0 - y;
    return [atan2(x, abs(r0y)) / n * sign(r0y), asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))];
  };

  return project;
}

function geoConicEqualArea() {
  return conicProjection(conicEqualAreaRaw)
      .scale(155.424)
      .center([0, 33.6442]);
}

function geoAlbers() {
  return geoConicEqualArea()
      .parallels([29.5, 45.5])
      .scale(1070)
      .translate([480, 250])
      .rotate([96, 0])
      .center([-0.6, 38.7]);
}

// The projections must have mutually exclusive clip regions on the sphere,
// as this will avoid emitting interleaving lines and polygons.
function multiplex(streams) {
  var n = streams.length;
  return {
    point: function(x, y) { var i = -1; while (++i < n) streams[i].point(x, y); },
    sphere: function() { var i = -1; while (++i < n) streams[i].sphere(); },
    lineStart: function() { var i = -1; while (++i < n) streams[i].lineStart(); },
    lineEnd: function() { var i = -1; while (++i < n) streams[i].lineEnd(); },
    polygonStart: function() { var i = -1; while (++i < n) streams[i].polygonStart(); },
    polygonEnd: function() { var i = -1; while (++i < n) streams[i].polygonEnd(); }
  };
}

// A composite projection for the United States, configured by default for
// 960×500. The projection also works quite well at 960×600 if you change the
// scale to 1285 and adjust the translate accordingly. The set of standard
// parallels for each region comes from USGS, which is published here:
// http://egsc.usgs.gov/isb/pubs/MapProjections/projections.html#albers
function geoAlbersUsa() {
  var cache,
      cacheStream,
      lower48 = geoAlbers(), lower48Point,
      alaska = geoConicEqualArea().rotate([154, 0]).center([-2, 58.5]).parallels([55, 65]), alaskaPoint, // EPSG:3338
      hawaii = geoConicEqualArea().rotate([157, 0]).center([-3, 19.9]).parallels([8, 18]), hawaiiPoint, // ESRI:102007
      point, pointStream = {point: function(x, y) { point = [x, y]; }};

  function albersUsa(coordinates) {
    var x = coordinates[0], y = coordinates[1];
    return point = null,
        (lower48Point.point(x, y), point)
        || (alaskaPoint.point(x, y), point)
        || (hawaiiPoint.point(x, y), point);
  }

  albersUsa.invert = function(coordinates) {
    var k = lower48.scale(),
        t = lower48.translate(),
        x = (coordinates[0] - t[0]) / k,
        y = (coordinates[1] - t[1]) / k;
    return (y >= 0.120 && y < 0.234 && x >= -0.425 && x < -0.214 ? alaska
        : y >= 0.166 && y < 0.234 && x >= -0.214 && x < -0.115 ? hawaii
        : lower48).invert(coordinates);
  };

  albersUsa.stream = function(stream) {
    return cache && cacheStream === stream ? cache : cache = multiplex([lower48.stream(cacheStream = stream), alaska.stream(stream), hawaii.stream(stream)]);
  };

  albersUsa.precision = function(_) {
    if (!arguments.length) return lower48.precision();
    lower48.precision(_), alaska.precision(_), hawaii.precision(_);
    return reset();
  };

  albersUsa.scale = function(_) {
    if (!arguments.length) return lower48.scale();
    lower48.scale(_), alaska.scale(_ * 0.35), hawaii.scale(_);
    return albersUsa.translate(lower48.translate());
  };

  albersUsa.translate = function(_) {
    if (!arguments.length) return lower48.translate();
    var k = lower48.scale(), x = +_[0], y = +_[1];

    lower48Point = lower48
        .translate(_)
        .clipExtent([[x - 0.455 * k, y - 0.238 * k], [x + 0.455 * k, y + 0.238 * k]])
        .stream(pointStream);

    alaskaPoint = alaska
        .translate([x - 0.307 * k, y + 0.201 * k])
        .clipExtent([[x - 0.425 * k + epsilon, y + 0.120 * k + epsilon], [x - 0.214 * k - epsilon, y + 0.234 * k - epsilon]])
        .stream(pointStream);

    hawaiiPoint = hawaii
        .translate([x - 0.205 * k, y + 0.212 * k])
        .clipExtent([[x - 0.214 * k + epsilon, y + 0.166 * k + epsilon], [x - 0.115 * k - epsilon, y + 0.234 * k - epsilon]])
        .stream(pointStream);

    return reset();
  };

  albersUsa.fitExtent = fitExtent(albersUsa);

  albersUsa.fitSize = fitSize(albersUsa);

  function reset() {
    cache = cacheStream = null;
    return albersUsa;
  }

  return albersUsa.scale(1070);
}

function azimuthalRaw(scale) {
  return function(x, y) {
    var cx = cos(x),
        cy = cos(y),
        k = scale(cx * cy);
    return [
      k * cy * sin(x),
      k * sin(y)
    ];
  }
}

function azimuthalInvert(angle) {
  return function(x, y) {
    var z = sqrt$1(x * x + y * y),
        c = angle(z),
        sc = sin(c),
        cc = cos(c);
    return [
      atan2(x * sc, z * cc),
      asin(z && y * sc / z)
    ];
  }
}

var azimuthalEqualAreaRaw = azimuthalRaw(function(cxcy) {
  return sqrt$1(2 / (1 + cxcy));
});

azimuthalEqualAreaRaw.invert = azimuthalInvert(function(z) {
  return 2 * asin(z / 2);
});

function geoAzimuthalEqualArea() {
  return projection(azimuthalEqualAreaRaw)
      .scale(124.75)
      .clipAngle(180 - 1e-3);
}

var azimuthalEquidistantRaw = azimuthalRaw(function(c) {
  return (c = acos(c)) && c / sin(c);
});

azimuthalEquidistantRaw.invert = azimuthalInvert(function(z) {
  return z;
});

function geoAzimuthalEquidistant() {
  return projection(azimuthalEquidistantRaw)
      .scale(79.4188)
      .clipAngle(180 - 1e-3);
}

function mercatorRaw(lambda, phi) {
  return [lambda, log$2(tan((halfPi + phi) / 2))];
}

mercatorRaw.invert = function(x, y) {
  return [x, 2 * atan(exp(y)) - halfPi];
};

function geoMercator() {
  return mercatorProjection(mercatorRaw)
      .scale(961 / tau);
}

function mercatorProjection(project) {
  var m = projection(project),
      scale = m.scale,
      translate = m.translate,
      clipExtent = m.clipExtent,
      clipAuto;

  m.scale = function(_) {
    return arguments.length ? (scale(_), clipAuto && m.clipExtent(null), m) : scale();
  };

  m.translate = function(_) {
    return arguments.length ? (translate(_), clipAuto && m.clipExtent(null), m) : translate();
  };

  m.clipExtent = function(_) {
    if (!arguments.length) return clipAuto ? null : clipExtent();
    if (clipAuto = _ == null) {
      var k = pi * scale(),
          t = translate();
      _ = [[t[0] - k, t[1] - k], [t[0] + k, t[1] + k]];
    }
    clipExtent(_);
    return m;
  };

  return m.clipExtent(null);
}

function tany(y) {
  return tan((halfPi + y) / 2);
}

function conicConformalRaw(y0, y1) {
  var cy0 = cos(y0),
      n = y0 === y1 ? sin(y0) : log$2(cy0 / cos(y1)) / log$2(tany(y1) / tany(y0)),
      f = cy0 * pow$1(tany(y0), n) / n;

  if (!n) return mercatorRaw;

  function project(x, y) {
    if (f > 0) { if (y < -halfPi + epsilon) y = -halfPi + epsilon; }
    else { if (y > halfPi - epsilon) y = halfPi - epsilon; }
    var r = f / pow$1(tany(y), n);
    return [r * sin(n * x), f - r * cos(n * x)];
  }

  project.invert = function(x, y) {
    var fy = f - y, r = sign(n) * sqrt$1(x * x + fy * fy);
    return [atan2(x, abs(fy)) / n * sign(fy), 2 * atan(pow$1(f / r, 1 / n)) - halfPi];
  };

  return project;
}

function geoConicConformal() {
  return conicProjection(conicConformalRaw)
      .scale(109.5)
      .parallels([30, 30]);
}

function equirectangularRaw(lambda, phi) {
  return [lambda, phi];
}

equirectangularRaw.invert = equirectangularRaw;

function geoEquirectangular() {
  return projection(equirectangularRaw)
      .scale(152.63);
}

function conicEquidistantRaw(y0, y1) {
  var cy0 = cos(y0),
      n = y0 === y1 ? sin(y0) : (cy0 - cos(y1)) / (y1 - y0),
      g = cy0 / n + y0;

  if (abs(n) < epsilon) return equirectangularRaw;

  function project(x, y) {
    var gy = g - y, nx = n * x;
    return [gy * sin(nx), g - gy * cos(nx)];
  }

  project.invert = function(x, y) {
    var gy = g - y;
    return [atan2(x, abs(gy)) / n * sign(gy), g - sign(n) * sqrt$1(x * x + gy * gy)];
  };

  return project;
}

function geoConicEquidistant() {
  return conicProjection(conicEquidistantRaw)
      .scale(131.154)
      .center([0, 13.9389]);
}

function gnomonicRaw(x, y) {
  var cy = cos(y), k = cos(x) * cy;
  return [cy * sin(x) / k, sin(y) / k];
}

gnomonicRaw.invert = azimuthalInvert(atan);

function geoGnomonic() {
  return projection(gnomonicRaw)
      .scale(144.049)
      .clipAngle(60);
}

function orthographicRaw(x, y) {
  return [cos(y) * sin(x), sin(y)];
}

orthographicRaw.invert = azimuthalInvert(asin);

function geoOrthographic() {
  return projection(orthographicRaw)
      .scale(249.5)
      .clipAngle(90 + epsilon);
}

function stereographicRaw(x, y) {
  var cy = cos(y), k = 1 + cos(x) * cy;
  return [cy * sin(x) / k, sin(y) / k];
}

stereographicRaw.invert = azimuthalInvert(function(z) {
  return 2 * atan(z);
});

function geoStereographic() {
  return projection(stereographicRaw)
      .scale(250)
      .clipAngle(142);
}

function transverseMercatorRaw(lambda, phi) {
  return [log$2(tan((halfPi + phi) / 2)), -lambda];
}

transverseMercatorRaw.invert = function(x, y) {
  return [-y, 2 * atan(exp(x)) - halfPi];
};

function geoTransverseMercator() {
  var m = mercatorProjection(transverseMercatorRaw),
      center = m.center,
      rotate = m.rotate;

  m.center = function(_) {
    return arguments.length ? center([-_[1], _[0]]) : (_ = center(), [_[1], -_[0]]);
  };

  m.rotate = function(_) {
    return arguments.length ? rotate([_[0], _[1], _.length > 2 ? _[2] + 90 : 90]) : (_ = rotate(), [_[0], _[1], _[2] - 90]);
  };

  return rotate([0, 0, 90])
      .scale(159.155);
}

/**
 * Map GeoJSON data to an SVG path string.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {number} params.pointRadius - The point radius for path points.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='path'] - The output field in which to store
 *   the generated path data (default 'path').
 */
function GeoPath(params) {
  Transform.call(this, null, params);
}

var prototype$32 = inherits(GeoPath, Transform);

prototype$32.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      path = this.value,
      field = _.field || identity$1,
      as = _.as || 'path',
      mod;

  function set(t) { t[as] = path(field(t)); }

  if (!path || _.modified()) {
    // parameters updated, reset and reflow
    this.value = path = geoPath()
      .pointRadius(_.pointRadius)
      .projection(_.projection);

    out.materialize().reflow().visit(out.SOURCE, set);
  } else {
    mod = field === identity$1 || pulse.modified(field.fields);
    out.visit(mod ? out.ADD_MOD : out.ADD, set);
  }

  return out.modifies(as);
};

/**
 * Geo-code a longitude/latitude point to an x/y coordinate.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {Array<function(object): *>} params.fields - A two-element array of
 *   field accessors for the longitude and latitude values.
 * @param {Array<string>} [params.as] - A two-element array of field names
 *   under which to store the result. Defaults to ['x','y'].
 */
function GeoPoint(params) {
  Transform.call(this, null, params);
}

var prototype$33 = inherits(GeoPoint, Transform);

prototype$33.transform = function(_, pulse) {
  var proj = _.projection,
      lon = _.fields[0],
      lat = _.fields[1],
      as = _.as || ['x', 'y'],
      x = as[0],
      y = as[1],
      mod;

  function set(t) {
    var xy = proj([lon(t), lat(t)]);
    if (xy) t[x] = xy[0], t[y] = xy[1];
    else t[x] = undefined, t[y] = undefined;
  }

  if (_.modified()) {
    // parameters updated, reflow
    pulse.materialize().reflow().visit(pulse.SOURCE, set);
  } else {
    mod = pulse.modified(lon.fields) || pulse.modified(lat.fields);
    pulse.visit(mod ? pulse.ADD_MOD : pulse.ADD, set);
  }

  return pulse.modifies(as);
};

/**
 * Annotate items with a geopath shape generator.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(number, number): *} params.projection - The cartographic
 *   projection to apply.
 * @param {number} params.pointRadius - The point radius for path points.
 * @param {function(object): *} [params.field] - The field with GeoJSON data,
 *   or null if the tuple itself is a GeoJSON feature.
 * @param {string} [params.as='path'] - The output field in which to store
 *   the generated path data (default 'path').
 */
function GeoShape(params) {
  Transform.call(this, null, params);
}

var prototype$34 = inherits(GeoShape, Transform);

prototype$34.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ALL),
      shape = this.value,
      datum = _.field || field('datum'),
      as = _.as || 'shape',
      flag = out.ADD_MOD;

  if (!shape || _.modified()) {
    // parameters updated, reset and reflow
    this.value = shape = shapeGenerator(
      geoPath().pointRadius(_.pointRadius).projection(_.projection),
      datum
    );

    out.materialize().reflow();
    flag = out.SOURCE;
  }

  out.visit(flag, function(t) { t[as] = shape; });

  return out.modifies(as);
};

function shapeGenerator(path, field) {
  var shape = function(_) { return path(field(_)); };
  shape.context = function(_) { return path.context(_), shape; };
  return shape;
}

/**
 * GeoJSON feature generator for creating graticules.
 * @constructor
 */
function Graticule(params) {
  Transform.call(this, [], params);
  this.generator = geoGraticule();
}

var prototype$35 = inherits(Graticule, Transform);

prototype$35.transform = function(_, pulse) {
  var out = pulse.fork(),
      src = this.value,
      gen = this.generator, t;

  if (!src.length || _.modified()) {
    for (var prop in _) {
      if (isFunction(gen[prop])) {
        gen[prop](_[prop]);
      }
    }
  }

  t = gen();
  if (src.length) {
    t._id = src[0]._id;
    out.mod.push(t);
  } else {
    out.add.push(ingest(t));
  }
  src[0] = t;

  return out.source = src, out;
};

var properties = [
  // standard properties in d3-geo
  'clipAngle',
  'clipExtent',
  'scale',
  'translate',
  'center',
  'rotate',
  'parallels',
  'precision',

  // extended properties in d3-geo-projections
  'coefficient',
  'distance',
  'fraction',
  'lobes',
  'parallel',
  'radius',
  'ratio',
  'spacing',
  'tilt'
];

/**
 * Augment projections with their type and a copy method.
 */
function create$2(type, constructor) {
  return function projection() {
    var p = constructor();

    p.type = type;

    p.copy = p.copy || function() {
      var c = projection();
      properties.forEach(function(prop) {
        if (p.hasOwnProperty(prop)) c[prop](p[prop]());
      });
      return c;
    };

    return p;
  };
}

function projection$1(type, proj) {
  return arguments.length > 1 ? (projections[type] = create$2(type, proj), this)
    : projections.hasOwnProperty(type) ? projections[type] : null;
}

var projections = {
  // base d3-geo projection types
  albers:               geoAlbers,
  albersusa:            geoAlbersUsa,
  azimuthalequalarea:   geoAzimuthalEqualArea,
  azimuthalequidistant: geoAzimuthalEquidistant,
  conicconformal:       geoConicConformal,
  conicequalarea:       geoConicEqualArea,
  conicequidistant:     geoConicEquidistant,
  equirectangular:      geoEquirectangular,
  gnomonic:             geoGnomonic,
  mercator:             geoMercator,
  orthographic:         geoOrthographic,
  stereographic:        geoStereographic,
  transversemercator:   geoTransverseMercator
};

for (var key$3 in projections) {
  projection$1(key$3, projections[key$3]);
}

/**
 * Maintains a cartographic projection.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Projection(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$36 = inherits(Projection, Transform);

prototype$36.transform = function(_) {
  var proj = this.value;

  if (!proj || _.modified('type')) {
    this.value = (proj = create$1(_.type));
    properties.forEach(function(prop) {
      if (_[prop] != null) set$2(proj, prop, _[prop]);
    });
  } else {
    properties.forEach(function(prop) {
      if (_.modified(prop)) set$2(proj, prop, _[prop]);
    });
  }
};

function create$1(type) {
  var constructor = projection$1((type || 'mercator').toLowerCase());
  if (!constructor) error('Unrecognized projection type: ' + type);
  return constructor();
}

function set$2(proj, key, value) {
   if (isFunction(proj[key])) proj[key](value);
}

var GeoPathDefinition = {
  "type": "GeoPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection", "required": true },
    { "name": "pointRadius", "type": "number" },
    { "name": "field", "type": "field" },
    { "name": "as", "type": "string", "default": "path" }
  ]
}

var GeoPointDefinition = {
  "type": "GeoPoint",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection", "required": true },
    { "name": "fields", "type": "field", "array": true, "required": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["x", "y"] }
  ]
}

var GeoShapeDefinition = {
  "type": "GeoShape",
  "metadata": {"modifies": true},
  "params": [
    { "name": "projection", "type": "projection", "required": true },
    { "name": "pointRadius", "type": "number" },
    { "name": "field", "type": "field", "default": "datum" },
    { "name": "as", "type": "string", "default": "shape" }
  ]
}

var GraticuleDefinition = {
  "type": "Graticule",
  "metadata": {"source": true, "generates": true, "changes": true},
  "params": [
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "extentMajor", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "extentMinor", "type": "array", "array": true, "length": 2,
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "step", "type": "number", "array": true, "length": 2 },
    { "name": "stepMajor", "type": "number", "array": true, "length": 2, "default": [90, 360] },
    { "name": "stepMinor", "type": "number", "array": true, "length": 2, "default": [10, 10] },
    { "name": "precision", "type": "number", "default": 2.5 }
  ]
};

register(GeoPathDefinition, GeoPath);
register(GeoPointDefinition, GeoPoint);
register(GeoShapeDefinition, GeoShape);
register(GraticuleDefinition, Graticule);

transform('Projection', Projection);

/**
 * Generate tick values for the given scale and approximate tick count or
 * interval value. If the scale has a 'ticks' method, it will be used to
 * generate the ticks, with the count argument passed as a parameter. If the
 * scale lacks a 'ticks' method, the full scale domain will be returned.
 * @param {Scale} scale - The scale for which to generate tick values.
 * @param {*} [count] - The approximate number of desired ticks.
 * @return {Array<*>} - The generated tick values.
 */
function tickValues(scale, count) {
  return scale.ticks ? scale.ticks(count) : scale.domain();
}

/**
 * Generate a label format function for a scale. If the scale has a
 * 'tickFormat' method, it will be used to generate the formatter, with the
 * count and specifier arguments passed as parameters. If the scale lacks a
 * 'tickFormat' method, the returned formatter performs simple string coercion.
 * If the input scale is a logarithmic scale and the format specifier does not
 * indicate a desired decimal precision, a special variable precision formatter
 * that automatically trims trailing zeroes will be generated.
 * @param {Scale} scale - The scale for which to generate the label formatter.
 * @param {*} [count] - The approximate number of desired ticks.
 * @param {string} [specifier] - The format specifier. Must be a legal d3 4.0
 *   specifier string (see https://github.com/d3/d3-format#formatSpecifier).
 * @return {function(*):string} - The generated label formatter.
 */
function tickFormat$1(scale, count, specifier) {
  var format = scale.tickFormat
    ? scale.tickFormat(count, specifier)
    : String;

  return (scale.type === 'log')
    ? filter$1(format, variablePrecision(specifier))
    : format;
}

function filter$1(sourceFormat, targetFormat) {
  return function(_) {
    return sourceFormat(_) ? targetFormat(_) : '';
  };
}

function variablePrecision(specifier) {
  var s = formatSpecifier(specifier || ',');

  if (s.precision == null) {
    s.precision = 12;
    switch (s.type) {
      case '%': s.precision -= 2; break;
      case 'e': s.precision -= 1; break;
    }
    return trimZeroes(
      format(s),          // number format
      format('.1f')(1)[1] // decimal point character
    );
  } else {
    return format(s);
  }
}

function trimZeroes(format, decimalChar) {
  return function(x) {
    var str = format(x),
        dec = str.indexOf(decimalChar),
        idx, end;

    if (dec < 0) return str;

    idx = rightmostDigit(str, dec);
    end = idx < str.length ? str.slice(idx) : '';
    while (--idx > dec) if (str[idx] !== '0') { ++idx; break; }

    return str.slice(0, idx) + end;
  };
}

function rightmostDigit(str, dec) {
  var i = str.lastIndexOf('e'), c;
  if (i > 0) return i;
  for (i=str.length; --i > dec;) {
    c = str.charCodeAt(i);
    if (c >= 48 && c <= 57) return i + 1; // is digit
  }
}

/**
 * Generates axis ticks for visualizing a spatial scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate ticks for.
 * @param {*} [params.count=10] - The approximate number of ticks, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid d3 4.0 format specifier.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
function AxisTicks(params) {
  Transform.call(this, [], params);
}

var prototype$37 = inherits(AxisTicks, Transform);

prototype$37.transform = function(_, pulse) {
  if (this.value != null && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(),
      ticks = this.value,
      scale = _.scale,
      count = _.count == null ? 10 : _.count,
      format = _.format || tickFormat$1(scale, count, _.formatSpecifier),
      values = _.values || tickValues(scale, count);

  if (ticks) out.rem = ticks;

  ticks = values.map(function(value) {
    return ingest({value: value, label: format(value)})
  });

  if (_.extra) {
    // add an extra tick pegged to the initial domain value
    // this is used to generate axes with 'binned' domains
    ticks.push(ingest({
      extra: {value: ticks[0].value},
      label: ''
    }));
  }

  return (out.source = out.add = this.value = ticks), out;
};

function get$2(map, key) {
  return map.hasOwnProperty(key) ? map[key] : null;
}

/**
 * Joins a set of data elements against a set of visual items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): object} [params.item] - An item generator function.
 * @param {function(object): *} [params.key] - The key field associating data and visual items.
 */
function DataJoin(params) {
  Transform.call(this, null, params);
}

var prototype$38 = inherits(DataJoin, Transform);

function defaultItemCreate() {
  return ingest({});
}

prototype$38.transform = function(_, pulse) {
  var out = pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS),
      item = _.item || defaultItemCreate,
      key = _.key || tupleid,
      map = this.value || (pulse = pulse.addAll(), this.value = {});

  if (_.modified('key') || pulse.modified(key)) {
    error('DataJoin does not support modified key function or fields.');
  }

  pulse.visit(pulse.ADD, function(t) {
    var k = key(t),
        x = get$2(map, k);

    if (x) {
      (x.exit ? out.add : out.mod).push(x);
    } else {
      map[k] = (x = item(t));
      out.add.push(x);
    }

    x.datum = t;
    x.exit = false;
  });

  pulse.visit(pulse.MOD, function(t) {
    var k = key(t),
        x = get$2(map, k);

    if (x) {
      out.mod.push(x);
    }
  });

  pulse.visit(pulse.REM, function(t) {
    var k = key(t),
        x = get$2(map, k);

    if (t === x.datum) {
      out.rem.push(x);
      x.exit = true;
    }
  });

  return out;
};

/**
 * Invokes encoding functions for visual items.
 * @constructor
 * @param {object} params - The parameters to the encoding functions. This
 *   parameter object will be passed through to all invoked encoding functions.
 * @param {object} param.encoders - The encoding functions
 * @param {function(object, object): boolean} [param.encoders.update] - Update encoding set
 * @param {function(object, object): boolean} [param.encoders.enter] - Enter encoding set
 * @param {function(object, object): boolean} [param.encoders.exit] - Exit encoding set
 */
function Encode(params) {
  Transform.call(this, null, params);
}

var prototype$39 = inherits(Encode, Transform);

prototype$39.transform = function(_, pulse) {
  var out = pulse.fork(pulse.ADD_REM),
      encode = pulse.encode,
      reenter = encode === 'enter',
      update = _.encoders.update || falsy,
      enter = _.encoders.enter || falsy,
      exit = _.encoders.exit || falsy,
      set = (encode && !reenter ? _.encoders[encode] : update) || falsy;

  if (pulse.changed(pulse.ADD)) {
    pulse.visit(pulse.ADD, function(t) {
      enter(t, _);
      update(t, _);
      if (set !== falsy && set !== update) set(t, _);
    });
    out.modifies(enter.output);
    out.modifies(update.output);
    if (set !== falsy && set !== update) out.modifies(set.output);
  }

  if (pulse.changed(pulse.REM) && exit !== falsy) {
    pulse.visit(pulse.REM, function(t) { exit(t, _); });
    out.modifies(exit.output);
  }

  if (reenter || set !== falsy) {
    var flag = pulse.MOD | (_.modified() ? pulse.REFLOW : 0);
    if (reenter) {
      pulse.visit(flag, function(t) {
        var mod = enter(t, _);
        if (set(t, _) || mod) out.mod.push(t);
      });
      if (out.mod.length) out.modifies(enter.output);
    } else {
      pulse.visit(flag, function(t) {
        if (set(t, _)) out.mod.push(t);
      });
    }
    if (out.mod.length) out.modifies(set.output);
  }

  return out;
};

/**
 * Generates legend entries for visualizing a scale.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Scale} params.scale - The scale to generate items for.
 * @param {*} [params.count=10] - The approximate number of items, or
 *   desired tick interval, to use.
 * @param {Array<*>} [params.values] - The exact tick values to use.
 *   These must be legal domain values for the provided scale.
 *   If provided, the count argument is ignored.
 * @param {function(*):string} [params.formatSpecifier] - A format specifier
 *   to use in conjunction with scale.tickFormat. Legal values are
 *   any valid d3 4.0 format specifier.
 * @param {function(*):string} [params.format] - The format function to use.
 *   If provided, the formatSpecifier argument is ignored.
 */
function LegendEntries(params) {
  Transform.call(this, [], params);
}

var prototype$40 = inherits(LegendEntries, Transform);

prototype$40.transform = function(_, pulse) {
  if (this.value != null && !_.modified()) {
    return pulse.StopPropagation;
  }

  var out = pulse.fork(),
      total = 0,
      items = this.value,
      grad  = _.type === 'gradient',
      scale = _.scale,
      count = _.count == null ? 5 : _.count,
      format = _.format || tickFormat$1(scale, count, _.formatSpecifier),
      values = _.values || (grad ? scale.domain() : tickValues(scale, count));

  if (items) out.rem = items;

  if (grad) {
    var domain = _.values ? scale.domain() : values,
        min = domain[0],
        max = domain[domain.length - 1],
        fraction = scale.range
            ? scale.copy().domain([min, max]).range([0, 1])
            : function(_) { return (_ - min) / (max - min); };
  } else {
    var size = _.size;
    if (!isFunction(size)) size = constant$1(size || 8);
  }

  items = values.map(function(value, index) {
    var t = ingest({index: index, label: format(value), value: value});
    if (grad) {
      t.perc = fraction(value);
    } else {
      t.size = size(value);
      t.total = Math.round(total);
      total += t.size;
    }
    return t;
  });

  return (out.source = out.add = this.value = items), out;
};

var Paths = {
  'line': line,
  'line-radial': lineR,
  'curve': curve,
  'curve-radial': curveR,
  'orthogonal-horizontal': orthoX,
  'orthogonal-vertical': orthoY,
  'orthogonal-radial': orthoR,
  'diagonal-horizontal': diagonalX,
  'diagonal-vertical': diagonalY,
  'diagonal-radial': diagonalR
};

function sourceX(t) { return t.source.x; }
function sourceY(t) { return t.source.y; }
function targetX(t) { return t.target.x; }
function targetY(t) { return t.target.y; }

 /**
  * Layout paths linking source and target elements.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
function LinkPath(params) {
  Transform.call(this, {}, params);
}

var prototype$41 = inherits(LinkPath, Transform);

prototype$41.transform = function(_, pulse) {
  var sx = _.sourceX || sourceX,
      sy = _.sourceY || sourceY,
      tx = _.targetX || targetX,
      ty = _.targetY || targetY,
      as = _.as || 'path',
      orient = _.orient || 'vertical',
      shape = _.shape || 'line',
      path = get$2(Paths, shape + '-' + orient) || get$2(Paths, shape);

  if (!path) {
    error('LinkPath unsupported type: ' + _.shape + '-' + _.orient);
  }

  pulse.reflow().visit(pulse.SOURCE, function(t) {
    t[as] = path(sx(t), sy(t), tx(t), ty(t));
  });

  return pulse.modifies(as);
};

// -- Link Path Generation Methods -----

function line(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'L' + tx + ',' + ty;
}

function lineR(sa, sr, ta, tr) {
  return line(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}

function curve(sx, sy, tx, ty) {
  var dx = tx - sx,
      dy = ty - sy,
      ix = 0.2 * (dx + dy),
      iy = 0.2 * (dy - dx);
  return 'M' + sx + ',' + sy +
         'C' + (sx+ix) + ',' + (sy+iy) +
         ' ' + (tx+iy) + ',' + (ty-ix) +
         ' ' + tx + ',' + ty;
}

function curveR(sa, sr, ta, tr) {
  return curve(
    sr * Math.cos(sa), sr * Math.sin(sa),
    tr * Math.cos(ta), tr * Math.sin(ta)
  );
}

function orthoX(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'V' + ty + 'H' + tx;
}

function orthoY(sx, sy, tx, ty) {
  return 'M' + sx + ',' + sy +
         'H' + tx + 'V' + ty;
}

function orthoR(sa, sr, ta, tr) {
  var sc = Math.cos(sa),
      ss = Math.sin(sa),
      tc = Math.cos(ta),
      ts = Math.sin(ta),
      sf = Math.abs(ta - sa) > Math.PI ? ta <= sa : ta > sa;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'A' + sr + ',' + sr + ' 0 0,' + (sf?1:0) +
         ' ' + (sr*tc) + ',' + (sr*ts) +
         'L' + (tr*tc) + ',' + (tr*ts);
}

function diagonalX(sx, sy, tx, ty) {
  var m = (sx + tx) / 2;
  return 'M' + sx + ',' + sy +
         'C' + m  + ',' + sy +
         ' ' + m  + ',' + ty +
         ' ' + tx + ',' + ty;
}

function diagonalY(sx, sy, tx, ty) {
  var m = (sy + ty) / 2;
  return 'M' + sx + ',' + sy +
         'C' + sx + ',' + m +
         ' ' + tx + ',' + m +
         ' ' + tx + ',' + ty;
}

function diagonalR(sa, sr, ta, tr) {
  var sc = Math.cos(sa),
      ss = Math.sin(sa),
      tc = Math.cos(ta),
      ts = Math.sin(ta),
      mr = (sr + tr) / 2;
  return 'M' + (sr*sc) + ',' + (sr*ss) +
         'C' + (mr*sc) + ',' + (mr*ss) +
         ' ' + (mr*tc) + ',' + (mr*ts) +
         ' ' + (tr*tc) + ',' + (tr*ts);
}

/**
 * Pie and donut chart layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size pie segments.
 * @param {number} [params.startAngle=0] - The start angle (in radians) of the layout.
 * @param {number} [params.endAngle=2π] - The end angle (in radians) of the layout.
 * @param {boolean} [params.sort] - Boolean flag for sorting sectors by value.
 */
function Pie(params) {
  Transform.call(this, null, params);
}

var prototype$42 = inherits(Pie, Transform);

prototype$42.transform = function(_, pulse) {
  var as = _.as || ['startAngle', 'endAngle'],
      startAngle = as[0],
      endAngle = as[1],
      field = _.field || one,
      start = _.startAngle || 0,
      stop = _.endAngle != null ? _.endAngle : 2 * Math.PI,
      data = pulse.source,
      values = data.map(field),
      n = values.length,
      a = start,
      k = (stop - start) / sum(values),
      index = range(n),
      i, t, v;

  if (_.sort) {
    index.sort(function(a, b) {
      return values[a] - values[b];
    });
  }

  for (i=0; i<n; ++i) {
    v = values[index[i]];
    t = data[index[i]];
    t[startAngle] = a;
    t[endAngle] = (a += v * k);
  }

  this.value = values;
  return pulse.reflow().modifies(as);
};

var SKIP$2 = {
  'set': 1,
  'modified': 1,
  'clear': 1,

  'type': 1,
  'scheme': 1,

  'domain': 1,
  'domainMin': 1,
  'domainMax': 1,
  'nice': 1,
  'zero': 1,

  'range': 1,
  'round': 1,
  'bandSize': 1,
  'reverse': 1
};

var INCLUDE_ZERO = toSet(['linear', 'pow', 'sqrt']);

/**
 * Maintains a scale function mapping data values to visual channels.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Scale(params) {
  Transform.call(this, null, params);
  this.modified(true); // always treat as modified
}

var prototype$43 = inherits(Scale, Transform);

prototype$43.transform = function(_, pulse) {
  var scale = this.value, prop,
      create = !scale
            || _.modified('type')
            || _.modified('scheme')
            || _.scheme && _.modified('reverse');

  if (create) {
    this.value = (scale = createScale(_.type, _.scheme, _.reverse));
  }

  for (prop in _) if (!SKIP$2[prop]) {
    isFunction(scale[prop])
      ? scale[prop](_[prop])
      : pulse.dataflow.warn('Unsupported scale property: ' + prop);
  }

  configureRange(scale, _, configureDomain(scale, _));

  return pulse.fork(pulse.NO_SOURCE | pulse.NO_FIELDS);
};

function createScale(type, scheme, reverse) {
  var scale$$ = scale((type || 'linear').toLowerCase());
  return scale$$(scheme && scheme.toLowerCase(), reverse);
}

function configureDomain(scale, _) {
  var domain = _.domain,
      zero = _.zero || (_.zero === undefined && INCLUDE_ZERO[scale.type]),
      n;

  if (!domain) return 0;

  if (zero || _.domainMin != null || _.domainMax != null) {
    n = (domain = domain.slice()).length - 1;
    if (zero) {
      if (domain[0] > 0) domain[0] = 0;
      if (domain[n] < 0) domain[n] = 0;
    }
    if (_.domainMin != null) domain[0] = _.domainMin;
    if (_.domainMax != null) domain[n] = _.domainMax;
  }

  scale.domain(domain);
  if (_.nice && scale.nice) scale.nice((_.nice !== true && +_.nice) || null);
  return domain.length;
}

function configureRange(scale, _, count) {
  var type = scale.type,
      range = _.range;

  if (_.bandSize != null) {
    if (type !== 'band' && type !== 'point') {
      error('Only band and point scales support bandSize.');
    }
    range = [0, _.bandSize * count];
  }

  if (range) {
    if (_.reverse) range = range.slice().reverse();
    scale[_.round ? 'rangeRound' : 'range'](range);
  }
}

var Center = 'center';
var Normalize = 'normalize';
/**
 * Stack layout for visualization elements.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to stack.
 * @param {Array<function(object): *>} [params.groupby] - An array of accessors to groupby.
 * @param {function(object,object): number} [params.sort] - A comparator for stack sorting.
 * @param {string} [offset='zero'] - One of 'zero', 'center', 'normalize'.
 */
function Stack(params) {
  Transform.call(this, null, params);
}

var prototype$44 = inherits(Stack, Transform);

prototype$44.transform = function(_, pulse) {
  var as = _.as || ['y0', 'y1'],
      y0 = as[0],
      y1 = as[1],
      field = _.field,
      offset = _.offset,
      groups, group, i, j, n, m,
      max, off, scale, t, a, b, v;

  // partition, sum, and sort the stack groups
  groups = partition$1(pulse.source, _.groupby, _.sort, field);

  // compute stack layouts per group
  for (i=0, n=groups.length, max=groups.max; i<n; ++i) {
    group = groups[i];
    off = offset===Center ? (max - group.sum)/2 : 0;
    scale = offset===Normalize ? (1/group.sum) : 1;

    // set stack coordinates for each datum in group
    for (b=off, v=0, j=0, m=group.length; j<m; ++j) {
      t = group[j];
      a = b; // use previous value for start point
      v += field(t);
      b = scale * v + off; // compute end point
      t[y0] = a;
      t[y1] = b;
    }
  }

  return pulse.reflow().modifies(as);
};

function partition$1(data, groupby, sort, field) {
  var groups = [],
      get = function(f) { return f(t); },
      map, i, n, m, t, k, g, s, max;

  // partition data points into stack groups
  if (groupby == null) {
    groups.push(data.slice());
  } else {
    for (map={}, i=0, n=data.length; i<n; ++i) {
      t = data[i];
      k = groupby.map(get);
      g = map[k] || (groups.push(map[k] = []), map[k]);
      g.push(t);
    }
  }

  // compute sums of groups, sort groups as needed
  for (k=0, max=0, m=groups.length; k<m; ++k) {
    g = groups[k];
    for (i=0, s=0, n=g.length; i<n; ++i) {
      s += field(g[i]);
    }
    g.sum = s;
    if (s > max) max = s;
    if (sort) g.sort(sort);
  }
  groups.max = max;

  return groups;
}

var LinkPathDefinition = {
  "type": "LinkPath",
  "metadata": {"modifies": true},
  "params": [
    { "name": "sourceX", "type": "field", "default": "source.x" },
    { "name": "sourceY", "type": "field", "default": "source.y" },
    { "name": "targetX", "type": "field", "default": "target.x" },
    { "name": "targetY", "type": "field", "default": "target.y" },
    { "name": "orient", "type": "enum", "default": "vertical",
      "values": ["horizontal", "vertical", "radial"] },
    { "name": "shape", "type": "enum", "default": "line",
      "values": ["line", "curve", "diagonal", "orthogonal"] },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

var PieDefinition = {
  "type": "Pie",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "startAngle", "type": "number", "default": 0 },
    { "name": "endAngle", "type": "number", "default": 6.283185307179586 },
    { "name": "sort", "type": "boolean", "default": false },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["startAngle", "endAngle"] }
  ]
};

var StackDefinition = {
  "type": "Stack",
  "metadata": {"modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "groupby", "type": "field", "array": true },
    { "name": "sort", "type": "compare" },
    { "name": "offset", "type": "enum", "default": "zero", "values": ["zero", "center", "normalize"] },
    { "name": "as", "type": "string", "array": true, "length": 2, "default": ["y0", "y1"] }
  ]
};

register(LinkPathDefinition, LinkPath);
register(PieDefinition, Pie);
register(StackDefinition, Stack);

transform('AxisTicks', AxisTicks);
transform('DataJoin', DataJoin);
transform('Encode', Encode);
transform('LegendEntries', LegendEntries);
transform('Scale', Scale);

function forceCenter(x, y) {
  var nodes;

  if (x == null) x = 0;
  if (y == null) y = 0;

  function force() {
    var i,
        n = nodes.length,
        node,
        sx = 0,
        sy = 0;

    for (i = 0; i < n; ++i) {
      node = nodes[i], sx += node.x, sy += node.y;
    }

    for (sx = sx / n - x, sy = sy / n - y, i = 0; i < n; ++i) {
      node = nodes[i], node.x -= sx, node.y -= sy;
    }
  }

  force.initialize = function(_) {
    nodes = _;
  };

  force.x = function(_) {
    return arguments.length ? (x = +_, force) : x;
  };

  force.y = function(_) {
    return arguments.length ? (y = +_, force) : y;
  };

  return force;
}

function constant$5(x) {
  return function() {
    return x;
  };
}

function jiggle() {
  return (Math.random() - 0.5) * 1e-6;
}

function tree_add(d) {
  var x = +this._x.call(null, d),
      y = +this._y.call(null, d);
  return add$2(this.cover(x, y), x, y, d);
}

function add$2(tree, x, y, d) {
  if (isNaN(x) || isNaN(y)) return tree; // ignore invalid points

  var parent,
      node = tree._root,
      leaf = {data: d},
      x0 = tree._x0,
      y0 = tree._y0,
      x1 = tree._x1,
      y1 = tree._y1,
      xm,
      ym,
      xp,
      yp,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return tree._root = leaf, tree;

  // Find the existing leaf for the new point, or add it.
  while (node.length) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (parent = node, !(node = node[i = bottom << 1 | right])) return parent[i] = leaf, tree;
  }

  // Is the new point is exactly coincident with the existing point?
  xp = +tree._x.call(null, node.data);
  yp = +tree._y.call(null, node.data);
  if (x === xp && y === yp) return leaf.next = node, parent ? parent[i] = leaf : tree._root = leaf, tree;

  // Otherwise, split the leaf node until the old and new point are separated.
  do {
    parent = parent ? parent[i] = new Array(4) : tree._root = new Array(4);
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
  } while ((i = bottom << 1 | right) === (j = (yp >= ym) << 1 | (xp >= xm)));
  return parent[j] = node, parent[i] = leaf, tree;
}

function addAll(data) {
  var d, i, n = data.length,
      x,
      y,
      xz = new Array(n),
      yz = new Array(n),
      x0 = Infinity,
      y0 = Infinity,
      x1 = -Infinity,
      y1 = -Infinity;

  // Compute the points and their extent.
  for (i = 0; i < n; ++i) {
    if (isNaN(x = +this._x.call(null, d = data[i])) || isNaN(y = +this._y.call(null, d))) continue;
    xz[i] = x;
    yz[i] = y;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }

  // If there were no (valid) points, inherit the existing extent.
  if (x1 < x0) x0 = this._x0, x1 = this._x1;
  if (y1 < y0) y0 = this._y0, y1 = this._y1;

  // Expand the tree to cover the new points.
  this.cover(x0, y0).cover(x1, y1);

  // Add the new points.
  for (i = 0; i < n; ++i) {
    add$2(this, xz[i], yz[i], data[i]);
  }

  return this;
}

function tree_cover(x, y) {
  if (isNaN(x = +x) || isNaN(y = +y)) return this; // ignore invalid points

  var x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1;

  // If the quadtree has no extent, initialize them.
  // Integer extent are necessary so that if we later double the extent,
  // the existing quadrant boundaries don’t change due to floating point error!
  if (isNaN(x0)) {
    x1 = (x0 = Math.floor(x)) + 1;
    y1 = (y0 = Math.floor(y)) + 1;
  }

  // Otherwise, double repeatedly to cover.
  else if (x0 > x || x > x1 || y0 > y || y > y1) {
    var z = x1 - x0,
        node = this._root,
        parent,
        i;

    switch (i = (y < (y0 + y1) / 2) << 1 | (x < (x0 + x1) / 2)) {
      case 0: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x1 = x0 + z, y1 = y0 + z, x > x1 || y > y1);
        break;
      }
      case 1: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x0 = x1 - z, y1 = y0 + z, x0 > x || y > y1);
        break;
      }
      case 2: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x1 = x0 + z, y0 = y1 - z, x > x1 || y0 > y);
        break;
      }
      case 3: {
        do parent = new Array(4), parent[i] = node, node = parent;
        while (z *= 2, x0 = x1 - z, y0 = y1 - z, x0 > x || y0 > y);
        break;
      }
    }

    if (this._root && this._root.length) this._root = node;
  }

  // If the quadtree covers the point already, just return.
  else return this;

  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  return this;
}

function tree_data() {
  var data = [];
  this.visit(function(node) {
    if (!node.length) do data.push(node.data); while (node = node.next)
  });
  return data;
}

function tree_extent(_) {
  return arguments.length
      ? this.cover(+_[0][0], +_[0][1]).cover(+_[1][0], +_[1][1])
      : isNaN(this._x0) ? undefined : [[this._x0, this._y0], [this._x1, this._y1]];
}

function Quad(node, x0, y0, x1, y1) {
  this.node = node;
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;
}

function tree_find(x, y, radius) {
  var data,
      x0 = this._x0,
      y0 = this._y0,
      x1,
      y1,
      x2,
      y2,
      x3 = this._x1,
      y3 = this._y1,
      quads = [],
      node = this._root,
      q,
      i;

  if (node) quads.push(new Quad(node, x0, y0, x3, y3));
  if (radius == null) radius = Infinity;
  else {
    x0 = x - radius, y0 = y - radius;
    x3 = x + radius, y3 = y + radius;
    radius *= radius;
  }

  while (q = quads.pop()) {

    // Stop searching if this quadrant can’t contain a closer node.
    if (!(node = q.node)
        || (x1 = q.x0) > x3
        || (y1 = q.y0) > y3
        || (x2 = q.x1) < x0
        || (y2 = q.y1) < y0) continue;

    // Bisect the current quadrant.
    if (node.length) {
      var xm = (x1 + x2) / 2,
          ym = (y1 + y2) / 2;

      quads.push(
        new Quad(node[3], xm, ym, x2, y2),
        new Quad(node[2], x1, ym, xm, y2),
        new Quad(node[1], xm, y1, x2, ym),
        new Quad(node[0], x1, y1, xm, ym)
      );

      // Visit the closest quadrant first.
      if (i = (y >= ym) << 1 | (x >= xm)) {
        q = quads[quads.length - 1];
        quads[quads.length - 1] = quads[quads.length - 1 - i];
        quads[quads.length - 1 - i] = q;
      }
    }

    // Visit this point. (Visiting coincident points isn’t necessary!)
    else {
      var dx = x - +this._x.call(null, node.data),
          dy = y - +this._y.call(null, node.data),
          d2 = dx * dx + dy * dy;
      if (d2 < radius) {
        var d = Math.sqrt(radius = d2);
        x0 = x - d, y0 = y - d;
        x3 = x + d, y3 = y + d;
        data = node.data;
      }
    }
  }

  return data;
}

function tree_remove(d) {
  if (isNaN(x = +this._x.call(null, d)) || isNaN(y = +this._y.call(null, d))) return this; // ignore invalid points

  var parent,
      node = this._root,
      retainer,
      previous,
      next,
      x0 = this._x0,
      y0 = this._y0,
      x1 = this._x1,
      y1 = this._y1,
      x,
      y,
      xm,
      ym,
      right,
      bottom,
      i,
      j;

  // If the tree is empty, initialize the root as a leaf.
  if (!node) return this;

  // Find the leaf node for the point.
  // While descending, also retain the deepest parent with a non-removed sibling.
  if (node.length) while (true) {
    if (right = x >= (xm = (x0 + x1) / 2)) x0 = xm; else x1 = xm;
    if (bottom = y >= (ym = (y0 + y1) / 2)) y0 = ym; else y1 = ym;
    if (!(parent = node, node = node[i = bottom << 1 | right])) return this;
    if (!node.length) break;
    if (parent[(i + 1) & 3] || parent[(i + 2) & 3] || parent[(i + 3) & 3]) retainer = parent, j = i;
  }

  // Find the point to remove.
  while (node.data !== d) if (!(previous = node, node = node.next)) return this;
  if (next = node.next) delete node.next;

  // If there are multiple coincident points, remove just the point.
  if (previous) return (next ? previous.next = next : delete previous.next), this;

  // If this is the root point, remove it.
  if (!parent) return this._root = next, this;

  // Remove this leaf.
  next ? parent[i] = next : delete parent[i];

  // If the parent now contains exactly one leaf, collapse superfluous parents.
  if ((node = parent[0] || parent[1] || parent[2] || parent[3])
      && node === (parent[3] || parent[2] || parent[1] || parent[0])
      && !node.length) {
    if (retainer) retainer[j] = node;
    else this._root = node;
  }

  return this;
}

function removeAll(data) {
  for (var i = 0, n = data.length; i < n; ++i) this.remove(data[i]);
  return this;
}

function tree_root() {
  return this._root;
}

function tree_size() {
  var size = 0;
  this.visit(function(node) {
    if (!node.length) do ++size; while (node = node.next)
  });
  return size;
}

function tree_visit(callback) {
  var quads = [], q, node = this._root, child, x0, y0, x1, y1;
  if (node) quads.push(new Quad(node, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    if (!callback(node = q.node, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1) && node.length) {
      var xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
    }
  }
  return this;
}

function tree_visitAfter(callback) {
  var quads = [], next = [], q;
  if (this._root) quads.push(new Quad(this._root, this._x0, this._y0, this._x1, this._y1));
  while (q = quads.pop()) {
    var node = q.node;
    if (node.length) {
      var child, x0 = q.x0, y0 = q.y0, x1 = q.x1, y1 = q.y1, xm = (x0 + x1) / 2, ym = (y0 + y1) / 2;
      if (child = node[0]) quads.push(new Quad(child, x0, y0, xm, ym));
      if (child = node[1]) quads.push(new Quad(child, xm, y0, x1, ym));
      if (child = node[2]) quads.push(new Quad(child, x0, ym, xm, y1));
      if (child = node[3]) quads.push(new Quad(child, xm, ym, x1, y1));
    }
    next.push(q);
  }
  while (q = next.pop()) {
    callback(q.node, q.x0, q.y0, q.x1, q.y1);
  }
  return this;
}

function defaultX(d) {
  return d[0];
}

function tree_x(_) {
  return arguments.length ? (this._x = _, this) : this._x;
}

function defaultY(d) {
  return d[1];
}

function tree_y(_) {
  return arguments.length ? (this._y = _, this) : this._y;
}

function quadtree(nodes, x, y) {
  var tree = new Quadtree(x == null ? defaultX : x, y == null ? defaultY : y, NaN, NaN, NaN, NaN);
  return nodes == null ? tree : tree.addAll(nodes);
}

function Quadtree(x, y, x0, y0, x1, y1) {
  this._x = x;
  this._y = y;
  this._x0 = x0;
  this._y0 = y0;
  this._x1 = x1;
  this._y1 = y1;
  this._root = undefined;
}

function leaf_copy(leaf) {
  var copy = {data: leaf.data}, next = copy;
  while (leaf = leaf.next) next = next.next = {data: leaf.data};
  return copy;
}

var treeProto = quadtree.prototype = Quadtree.prototype;

treeProto.copy = function() {
  var copy = new Quadtree(this._x, this._y, this._x0, this._y0, this._x1, this._y1),
      node = this._root,
      nodes,
      child;

  if (!node) return copy;

  if (!node.length) return copy._root = leaf_copy(node), copy;

  nodes = [{source: node, target: copy._root = new Array(4)}];
  while (node = nodes.pop()) {
    for (var i = 0; i < 4; ++i) {
      if (child = node.source[i]) {
        if (child.length) nodes.push({source: child, target: node.target[i] = new Array(4)});
        else node.target[i] = leaf_copy(child);
      }
    }
  }

  return copy;
};

treeProto.add = tree_add;
treeProto.addAll = addAll;
treeProto.cover = tree_cover;
treeProto.data = tree_data;
treeProto.extent = tree_extent;
treeProto.find = tree_find;
treeProto.remove = tree_remove;
treeProto.removeAll = removeAll;
treeProto.root = tree_root;
treeProto.size = tree_size;
treeProto.visit = tree_visit;
treeProto.visitAfter = tree_visitAfter;
treeProto.x = tree_x;
treeProto.y = tree_y;

function x(d) {
  return d.x + d.vx;
}

function y(d) {
  return d.y + d.vy;
}

function forceCollide(radius) {
  var nodes,
      radii,
      strength = 1,
      iterations = 1;

  if (typeof radius !== "function") radius = constant$5(radius == null ? 1 : +radius);

  function force() {
    var i, n = nodes.length,
        tree,
        node,
        xi,
        yi,
        ri,
        ri2;

    for (var k = 0; k < iterations; ++k) {
      tree = quadtree(nodes, x, y).visitAfter(prepare);
      for (i = 0; i < n; ++i) {
        node = nodes[i];
        ri = radii[i], ri2 = ri * ri;
        xi = node.x + node.vx;
        yi = node.y + node.vy;
        tree.visit(apply);
      }
    }

    function apply(quad, x0, y0, x1, y1) {
      var data = quad.data, rj = quad.r, r = ri + rj;
      if (data) {
        if (data.index > i) {
          var x = xi - data.x - data.vx,
              y = yi - data.y - data.vy,
              l = x * x + y * y;
          if (l < r * r) {
            if (x === 0) x = jiggle(), l += x * x;
            if (y === 0) y = jiggle(), l += y * y;
            l = (r - (l = Math.sqrt(l))) / l * strength;
            node.vx += (x *= l) * (r = (rj *= rj) / (ri2 + rj));
            node.vy += (y *= l) * r;
            data.vx -= x * (r = 1 - r);
            data.vy -= y * r;
          }
        }
        return;
      }
      return x0 > xi + r || x1 < xi - r || y0 > yi + r || y1 < yi - r;
    }
  }

  function prepare(quad) {
    if (quad.data) return quad.r = radii[quad.data.index];
    for (var i = quad.r = 0; i < 4; ++i) {
      if (quad[i] && quad[i].r > quad.r) {
        quad.r = quad[i].r;
      }
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    radii = new Array(n);
    for (i = 0; i < n; ++i) radii[i] = +radius(nodes[i], i, nodes);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = +_, force) : strength;
  };

  force.radius = function(_) {
    return arguments.length ? (radius = typeof _ === "function" ? _ : constant$5(+_), initialize(), force) : radius;
  };

  return force;
}

function index$1(d, i) {
  return i;
}

function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("missing: " + nodeId);
  return node;
}

function forceLink(links) {
  var id = index$1,
      strength = defaultStrength,
      strengths,
      distance = constant$5(30),
      distances,
      nodes,
      count,
      bias,
      iterations = 1;

  if (links == null) links = [];

  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }

  function force(alpha) {
    for (var k = 0, n = links.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, x, y, l, b; i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        x = target.x + target.vx - source.x - source.vx || jiggle();
        y = target.y + target.vy - source.y - source.vy || jiggle();
        l = Math.sqrt(x * x + y * y);
        l = (l - distances[i]) / l * alpha * strengths[i];
        x *= l, y *= l;
        target.vx -= x * (b = bias[i]);
        target.vy -= y * b;
        source.vx += x * (b = 1 - b);
        source.vy += y * b;
      }
    }
  }

  function initialize() {
    if (!nodes) return;

    var i,
        n = nodes.length,
        m = links.length,
        nodeById = map$1(nodes, id),
        link;

    for (i = 0, count = new Array(n); i < n; ++i) {
      count[i] = 0;
    }

    for (i = 0; i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find(nodeById, link.target);
      ++count[link.source.index], ++count[link.target.index];
    }

    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }

    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }

  function initializeStrength() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }

  function initializeDistance() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };

  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$5(+_), initializeStrength(), force) : strength;
  };

  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant$5(+_), initializeDistance(), force) : distance;
  };

  return force;
}

var frame = 0;
var timeout = 0;
var interval = 0;
var pokeDelay = 1000;
var taskHead;
var taskTail;
var clockLast = 0;
var clockNow = 0;
var clockSkew = 0;
var clock = typeof performance === "object" && performance.now ? performance : Date;
var setFrame = typeof requestAnimationFrame === "function" ? requestAnimationFrame : function(f) { setTimeout(f, 17); };
function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout) timeout = clearTimeout(timeout);
  var delay = time - clockNow;
  if (delay > 24) {
    if (time < Infinity) timeout = setTimeout(wake, delay);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function x$1(d) {
  return d.x;
}

function y$1(d) {
  return d.y;
}

var initialRadius = 10;
var initialAngle = Math.PI * (3 - Math.sqrt(5));
function forceSimulation(nodes) {
  var simulation,
      alpha = 1,
      alphaMin = 0.001,
      alphaDecay = 1 - Math.pow(alphaMin, 1 / 300),
      alphaTarget = 0,
      velocityDecay = 0.6,
      forces = map$1(),
      stepper = timer(step),
      event = dispatch("tick", "end");

  if (nodes == null) nodes = [];

  function step() {
    tick();
    event.call("tick", simulation);
    if (alpha < alphaMin) {
      stepper.stop();
      event.call("end", simulation);
    }
  }

  function tick() {
    var i, n = nodes.length, node;

    alpha += (alphaTarget - alpha) * alphaDecay;

    forces.each(function(force) {
      force(alpha);
    });

    for (i = 0; i < n; ++i) {
      node = nodes[i];
      if (node.fx == null) node.x += node.vx *= velocityDecay;
      else node.x = node.fx, node.vx = 0;
      if (node.fy == null) node.y += node.vy *= velocityDecay;
      else node.y = node.fy, node.vy = 0;
    }
  }

  function initializeNodes() {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.index = i;
      if (isNaN(node.x) || isNaN(node.y)) {
        var radius = initialRadius * Math.sqrt(i), angle = i * initialAngle;
        node.x = radius * Math.cos(angle);
        node.y = radius * Math.sin(angle);
      }
      if (isNaN(node.vx) || isNaN(node.vy)) {
        node.vx = node.vy = 0;
      }
    }
  }

  function initializeForce(force) {
    if (force.initialize) force.initialize(nodes);
    return force;
  }

  initializeNodes();

  return simulation = {
    tick: tick,

    restart: function() {
      return stepper.restart(step), simulation;
    },

    stop: function() {
      return stepper.stop(), simulation;
    },

    nodes: function(_) {
      return arguments.length ? (nodes = _, initializeNodes(), forces.each(initializeForce), simulation) : nodes;
    },

    alpha: function(_) {
      return arguments.length ? (alpha = +_, simulation) : alpha;
    },

    alphaMin: function(_) {
      return arguments.length ? (alphaMin = +_, simulation) : alphaMin;
    },

    alphaDecay: function(_) {
      return arguments.length ? (alphaDecay = +_, simulation) : +alphaDecay;
    },

    alphaTarget: function(_) {
      return arguments.length ? (alphaTarget = +_, simulation) : alphaTarget;
    },

    velocityDecay: function(_) {
      return arguments.length ? (velocityDecay = 1 - _, simulation) : 1 - velocityDecay;
    },

    force: function(name, _) {
      return arguments.length > 1 ? ((_ == null ? forces.remove(name) : forces.set(name, initializeForce(_))), simulation) : forces.get(name);
    },

    find: function(x, y, radius) {
      var i = 0,
          n = nodes.length,
          dx,
          dy,
          d2,
          node,
          closest;

      if (radius == null) radius = Infinity;
      else radius *= radius;

      for (i = 0; i < n; ++i) {
        node = nodes[i];
        dx = x - node.x;
        dy = y - node.y;
        d2 = dx * dx + dy * dy;
        if (d2 < radius) closest = node, radius = d2;
      }

      return closest;
    },

    on: function(name, _) {
      return arguments.length > 1 ? (event.on(name, _), simulation) : event.on(name);
    }
  };
}

function forceManyBody() {
  var nodes,
      node,
      alpha,
      strength = constant$5(-30),
      strengths,
      distanceMin2 = 1,
      distanceMax2 = Infinity,
      theta2 = 0.81;

  function force(_) {
    var i, n = nodes.length, tree = quadtree(nodes, x$1, y$1).visitAfter(accumulate);
    for (alpha = _, i = 0; i < n; ++i) node = nodes[i], tree.visit(apply);
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    for (i = 0; i < n; ++i) strengths[i] = +strength(nodes[i], i, nodes);
  }

  function accumulate(quad) {
    var strength = 0, q, c, x, y, i;

    // For internal nodes, accumulate forces from child quadrants.
    if (quad.length) {
      for (x = y = i = 0; i < 4; ++i) {
        if ((q = quad[i]) && (c = q.value)) {
          strength += c, x += c * q.x, y += c * q.y;
        }
      }
      quad.x = x / strength;
      quad.y = y / strength;
    }

    // For leaf nodes, accumulate forces from coincident quadrants.
    else {
      q = quad;
      q.x = q.data.x;
      q.y = q.data.y;
      do strength += strengths[q.data.index];
      while (q = q.next);
    }

    quad.value = strength;
  }

  function apply(quad, x1, _, x2) {
    if (!quad.value) return true;

    var x = quad.x - node.x,
        y = quad.y - node.y,
        w = x2 - x1,
        l = x * x + y * y;

    // Apply the Barnes-Hut approximation if possible.
    // Limit forces for very close nodes; randomize direction if coincident.
    if (w * w / theta2 < l) {
      if (l < distanceMax2) {
        if (x === 0) x = jiggle(), l += x * x;
        if (y === 0) y = jiggle(), l += y * y;
        if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
        node.vx += x * quad.value * alpha / l;
        node.vy += y * quad.value * alpha / l;
      }
      return true;
    }

    // Otherwise, process points directly.
    else if (quad.length || l >= distanceMax2) return;

    // Limit forces for very close nodes; randomize direction if coincident.
    if (quad.data !== node || quad.next) {
      if (x === 0) x = jiggle(), l += x * x;
      if (y === 0) y = jiggle(), l += y * y;
      if (l < distanceMin2) l = Math.sqrt(distanceMin2 * l);
    }

    do if (quad.data !== node) {
      w = strengths[quad.data.index] * alpha / l;
      node.vx += x * w;
      node.vy += y * w;
    } while (quad = quad.next);
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$5(+_), initialize(), force) : strength;
  };

  force.distanceMin = function(_) {
    return arguments.length ? (distanceMin2 = _ * _, force) : Math.sqrt(distanceMin2);
  };

  force.distanceMax = function(_) {
    return arguments.length ? (distanceMax2 = _ * _, force) : Math.sqrt(distanceMax2);
  };

  force.theta = function(_) {
    return arguments.length ? (theta2 = _ * _, force) : Math.sqrt(theta2);
  };

  return force;
}

function forceX(x) {
  var strength = constant$5(0.1),
      nodes,
      strengths,
      xz;

  if (typeof x !== "function") x = constant$5(x == null ? 0 : +x);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vx += (xz[i] - node.x) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    xz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(xz[i] = +x(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$5(+_), initialize(), force) : strength;
  };

  force.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$5(+_), initialize(), force) : x;
  };

  return force;
}

function forceY(y) {
  var strength = constant$5(0.1),
      nodes,
      strengths,
      yz;

  if (typeof y !== "function") y = constant$5(y == null ? 0 : +y);

  function force(alpha) {
    for (var i = 0, n = nodes.length, node; i < n; ++i) {
      node = nodes[i], node.vy += (yz[i] - node.y) * strengths[i] * alpha;
    }
  }

  function initialize() {
    if (!nodes) return;
    var i, n = nodes.length;
    strengths = new Array(n);
    yz = new Array(n);
    for (i = 0; i < n; ++i) {
      strengths[i] = isNaN(yz[i] = +y(nodes[i], i, nodes)) ? 0 : +strength(nodes[i], i, nodes);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant$5(+_), initialize(), force) : strength;
  };

  force.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$5(+_), initialize(), force) : y;
  };

  return force;
}

var ForceMap = {
  center: forceCenter,
  collide: forceCollide,
  nbody: forceManyBody,
  link: forceLink,
  x: forceX,
  y: forceY
};

var Forces = 'forces';
var ForceParams = [
      'alpha', 'alphaMin', 'alphaTarget',
      'velocityDecay', 'drag', 'forces'
    ];
var ForceConfig = ['static', 'iterations'];
var ForceOutput = ['x', 'y', 'vx', 'vy'];
/**
 * Force simulation layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<object>} params.forces - The forces to apply.
 */
function Force(params) {
  Transform.call(this, null, params);
}

var prototype$45 = inherits(Force, Transform);

prototype$45.transform = function(_, pulse) {
  var sim = this.value,
      change = pulse.changed(pulse.ADD_REM),
      params = _.modified(ForceParams),
      iters = _.iterations || 300;

  // configure simulation
  if (!sim) {
    this.value = sim = simulation(pulse.source, _);
    sim.on('tick', rerun(pulse.dataflow, this));
    if (!_.static) change = true, sim.tick(); // ensure we run on init
    pulse.modifies('index');
  } else {
    if (change) pulse.modifies('index'), sim.nodes(pulse.source);
    if (params) setup(sim, _);
  }

  // run simulation
  if (params || change || _.modified(ForceConfig)
      || (pulse.changed() && _.restart))
  {
    sim.alpha(Math.max(sim.alpha(), _.alpha || 1))
       .alphaDecay(1 - Math.pow(sim.alphaMin(), 1 / iters));

    if (_.static) {
      for (sim.stop(); --iters >= 0;) sim.tick();
    } else {
      if (sim.stopped()) sim.restart();
      if (!change) return pulse.StopPropagation; // defer to sim ticks
    }
  }

  return this.finish(pulse);
};

prototype$45.finish = function(pulse) {
  var dataflow = pulse.dataflow;

  // inspect dependencies, touch link source data
  for (var args=this._argops, j=0, m=args.length, arg; j<m; ++j) {
    arg = args[j];
    if (arg.name !== Forces || arg.op._argval.force !== 'link') {
      continue;
    }
    for (var ops=arg.op._argops, i=0, n=ops.length, op; i<n; ++i) {
      if (ops[i].name === 'links' && (op = ops[i].op.source)) {
        dataflow.touch(op); break;
      }
    }
  }

  // reflow all nodes
  return pulse.reflow().modifies(ForceOutput);
};

function rerun(df, op) {
  return function() { df.touch(op).run(); }
}

function simulation(nodes, _) {
  var sim = forceSimulation(nodes),
      stopped = false,
      stop = sim.stop,
      restart = sim.restart;

  sim.stopped = function() { return stopped; };
  sim.restart = function() { return stopped = false, restart(); };
  sim.stop = function() { return stopped = true, stop(); };

  return setup(sim, _, true).on('end', function() { stopped = true; });
}

function setup(sim, _, init) {
  var f = array$1(_.forces), i, n, p;

  for (i=0, n=ForceParams.length; i<n; ++i) {
    p = ForceParams[i];
    if (p !== Forces && _.modified(p)) sim[p](_[p]);
  }

  for (i=0, n=f.length; i<n; ++i) {
    if (init || _.modified(Forces, i)) {
      sim.force(Forces + i, getForce(f[i]));
    }
  }
  for (n=(sim.numForces || 0); i<n; ++i) {
    sim.force(Forces + i, null); // remove
  }

  return sim.numForces = f.length, sim;
}

function getForce(_) {
  var f, p;
  if (!ForceMap.hasOwnProperty(_.force)) {
    error('Unrecognized force: ' + _.force);
  }
  f = ForceMap[_.force]();
  for (p in _) if (isFunction(f[p])) f[p](_[p]);
  return f;
}

var ForceDefinition = {
  "type": "Force",
  "metadata": {"modifies": true},
  "params": [
    { "name": "static", "type": "boolean", "default": false },
    { "name": "restart", "type": "boolean", "default": false },
    { "name": "iterations", "type": "number", "default": 300 },
    { "name": "alpha", "type": "number", "default": 1 },
    { "name": "alphaMin", "type": "number", "default": 0.001 },
    { "name": "alphaTarget", "type": "number", "default": 0 },
    { "name": "drag", "type": "number", "default": 0.6 },
    { "name": "forces", "type": "param", "array": true,
      "params": [
        {
          "key": {"force": "center"},
          "params": [
            { "name": "x", "type": "number", "default": 0 },
            { "name": "y", "type": "number", "default": 0 }
          ]
        },
        {
          "key": {"force": "collide"},
          "params": [
            { "name": "radius", "type": "number", "expr": true },
            { "name": "strength", "type": "number", "default": 0.7 },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "nbody"},
          "params": [
            { "name": "strength", "type": "number", "default": -30 },
            { "name": "theta", "type": "number", "default": 0.9 },
            { "name": "distanceMin", "type": "number", "default": 1 },
            { "name": "distanceMax", "type": "number" }
          ]
        },
        {
          "key": {"force": "link"},
          "params": [
            { "name": "links", "type": "data" },
            { "name": "id", "type": "field" },
            { "name": "distance", "type": "number", "default": 30, "expr": true },
            { "name": "strength", "type": "number", "expr": true },
            { "name": "iterations", "type": "number", "default": 1 }
          ]
        },
        {
          "key": {"force": "x"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "x", "type": "field" }
          ]
        },
        {
          "key": {"force": "y"},
          "params": [
            { "name": "strength", "type": "number", "default": 0.1 },
            { "name": "y", "type": "field" }
          ]
        }
      ] },
    {
      "name": "as", "type": "string", "array": true, "modify": false,
      "default": ["x", "y", "vx", "vy"]
    }
  ]
};

register(ForceDefinition, Force);

function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}

function meanX(children) {
  return children.reduce(meanXReduce, 0) / children.length;
}

function meanXReduce(x, c) {
  return x + c.x;
}

function maxY(children) {
  return 1 + children.reduce(maxYReduce, 0);
}

function maxYReduce(y, c) {
  return Math.max(y, c.y);
}

function leafLeft(node) {
  var children;
  while (children = node.children) node = children[0];
  return node;
}

function leafRight(node) {
  var children;
  while (children = node.children) node = children[children.length - 1];
  return node;
}

function cluster() {
  var separation = defaultSeparation,
      dx = 1,
      dy = 1,
      nodeSize = false;

  function cluster(root) {
    var previousNode,
        x = 0;

    // First walk, computing the initial x & y values.
    root.eachAfter(function(node) {
      var children = node.children;
      if (children) {
        node.x = meanX(children);
        node.y = maxY(children);
      } else {
        node.x = previousNode ? x += separation(node, previousNode) : 0;
        node.y = 0;
        previousNode = node;
      }
    });

    var left = leafLeft(root),
        right = leafRight(root),
        x0 = left.x - separation(left, right) / 2,
        x1 = right.x + separation(right, left) / 2;

    // Second walk, normalizing x & y to the desired size.
    return root.eachAfter(nodeSize ? function(node) {
      node.x = (node.x - root.x) * dx;
      node.y = (root.y - node.y) * dy;
    } : function(node) {
      node.x = (node.x - x0) / (x1 - x0) * dx;
      node.y = (1 - (root.y ? node.y / root.y : 1)) * dy;
    });
  }

  cluster.separation = function(x) {
    return arguments.length ? (separation = x, cluster) : separation;
  };

  cluster.size = function(x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? null : [dx, dy]);
  };

  cluster.nodeSize = function(x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? [dx, dy] : null);
  };

  return cluster;
}

function node_each(callback) {
  var node = this, current, next = [node], children, i, n;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      callback(node), children = node.children;
      if (children) for (i = 0, n = children.length; i < n; ++i) {
        next.push(children[i]);
      }
    }
  } while (next.length);
  return this;
}

function node_eachBefore(callback) {
  var node = this, nodes = [node], children, i;
  while (node = nodes.pop()) {
    callback(node), children = node.children;
    if (children) for (i = children.length - 1; i >= 0; --i) {
      nodes.push(children[i]);
    }
  }
  return this;
}

function node_eachAfter(callback) {
  var node = this, nodes = [node], next = [], children, i, n;
  while (node = nodes.pop()) {
    next.push(node), children = node.children;
    if (children) for (i = 0, n = children.length; i < n; ++i) {
      nodes.push(children[i]);
    }
  }
  while (node = next.pop()) {
    callback(node);
  }
  return this;
}

function node_sum(value) {
  return this.eachAfter(function(node) {
    var sum = +value(node.data) || 0,
        children = node.children,
        i = children && children.length;
    while (--i >= 0) sum += children[i].value;
    node.value = sum;
  });
}

function node_sort(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}

function node_path(end) {
  var start = this,
      ancestor = leastCommonAncestor(start, end),
      nodes = [start];
  while (start !== ancestor) {
    start = start.parent;
    nodes.push(start);
  }
  var k = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k, 0, end);
    end = end.parent;
  }
  return nodes;
}

function leastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = a.ancestors(),
      bNodes = b.ancestors(),
      c = null;
  a = aNodes.pop();
  b = bNodes.pop();
  while (a === b) {
    c = a;
    a = aNodes.pop();
    b = bNodes.pop();
  }
  return c;
}

function node_ancestors() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
}

function node_descendants() {
  var nodes = [];
  this.each(function(node) {
    nodes.push(node);
  });
  return nodes;
}

function node_leaves() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}

function node_links() {
  var root = this, links = [];
  root.each(function(node) {
    if (node !== root) { // Don’t include the root’s parent, if any.
      links.push({source: node.parent, target: node});
    }
  });
  return links;
}

function hierarchy(data, children) {
  var root = new Node(data),
      valued = +data.value && (root.value = data.value),
      node,
      nodes = [root],
      child,
      childs,
      i,
      n;

  if (children == null) children = defaultChildren;

  while (node = nodes.pop()) {
    if (valued) node.value = +node.data.value;
    if ((childs = children(node.data)) && (n = childs.length)) {
      node.children = new Array(n);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new Node(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }

  return root.eachBefore(computeHeight);
}

function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}

function defaultChildren(d) {
  return d.children;
}

function copyData(node) {
  node.data = node.data.data;
}

function computeHeight(node) {
  var height = 0;
  do node.height = height;
  while ((node = node.parent) && (node.height < ++height));
}

function Node(data) {
  this.data = data;
  this.depth =
  this.height = 0;
  this.parent = null;
}

Node.prototype = hierarchy.prototype = {
  constructor: Node,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy
};

function Node$2(value) {
  this._ = value;
  this.next = null;
}

function shuffle$1(array) {
  var i,
      n = (array = array.slice()).length,
      head = null,
      node = head;

  while (n) {
    var next = new Node$2(array[n - 1]);
    if (node) node = node.next = next;
    else node = head = next;
    array[i] = array[--n];
  }

  return {
    head: head,
    tail: node
  };
}

function enclose(circles) {
  return encloseN(shuffle$1(circles), []);
}

function encloses(a, b) {
  var dx = b.x - a.x,
      dy = b.y - a.y,
      dr = a.r - b.r;
  return dr * dr + 1e-6 > dx * dx + dy * dy;
}

// Returns the smallest circle that contains circles L and intersects circles B.
function encloseN(L, B) {
  var circle,
      l0 = null,
      l1 = L.head,
      l2,
      p1;

  switch (B.length) {
    case 1: circle = enclose1(B[0]); break;
    case 2: circle = enclose2(B[0], B[1]); break;
    case 3: circle = enclose3(B[0], B[1], B[2]); break;
  }

  while (l1) {
    p1 = l1._, l2 = l1.next;
    if (!circle || !encloses(circle, p1)) {

      // Temporarily truncate L before l1.
      if (l0) L.tail = l0, l0.next = null;
      else L.head = L.tail = null;

      B.push(p1);
      circle = encloseN(L, B); // Note: reorders L!
      B.pop();

      // Move l1 to the front of L and reconnect the truncated list L.
      if (L.head) l1.next = L.head, L.head = l1;
      else l1.next = null, L.head = L.tail = l1;
      l0 = L.tail, l0.next = l2;

    } else {
      l0 = l1;
    }
    l1 = l2;
  }

  L.tail = l0;
  return circle;
}

function enclose1(a) {
  return {
    x: a.x,
    y: a.y,
    r: a.r
  };
}

function enclose2(a, b) {
  var x1 = a.x, y1 = a.y, r1 = a.r,
      x2 = b.x, y2 = b.y, r2 = b.r,
      x21 = x2 - x1, y21 = y2 - y1, r21 = r2 - r1,
      l = Math.sqrt(x21 * x21 + y21 * y21);
  return {
    x: (x1 + x2 + x21 / l * r21) / 2,
    y: (y1 + y2 + y21 / l * r21) / 2,
    r: (l + r1 + r2) / 2
  };
}

function enclose3(a, b, c) {
  var x1 = a.x, y1 = a.y, r1 = a.r,
      x2 = b.x, y2 = b.y, r2 = b.r,
      x3 = c.x, y3 = c.y, r3 = c.r,
      a2 = 2 * (x1 - x2),
      b2 = 2 * (y1 - y2),
      c2 = 2 * (r2 - r1),
      d2 = x1 * x1 + y1 * y1 - r1 * r1 - x2 * x2 - y2 * y2 + r2 * r2,
      a3 = 2 * (x1 - x3),
      b3 = 2 * (y1 - y3),
      c3 = 2 * (r3 - r1),
      d3 = x1 * x1 + y1 * y1 - r1 * r1 - x3 * x3 - y3 * y3 + r3 * r3,
      ab = a3 * b2 - a2 * b3,
      xa = (b2 * d3 - b3 * d2) / ab - x1,
      xb = (b3 * c2 - b2 * c3) / ab,
      ya = (a3 * d2 - a2 * d3) / ab - y1,
      yb = (a2 * c3 - a3 * c2) / ab,
      A = xb * xb + yb * yb - 1,
      B = 2 * (xa * xb + ya * yb + r1),
      C = xa * xa + ya * ya - r1 * r1,
      r = (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A);
  return {
    x: xa + xb * r + x1,
    y: ya + yb * r + y1,
    r: r
  };
}

function place(a, b, c) {
  var ax = a.x,
      ay = a.y,
      da = b.r + c.r,
      db = a.r + c.r,
      dx = b.x - ax,
      dy = b.y - ay,
      dc = dx * dx + dy * dy;
  if (dc) {
    var x = 0.5 + ((db *= db) - (da *= da)) / (2 * dc),
        y = Math.sqrt(Math.max(0, 2 * da * (db + dc) - (db -= dc) * db - da * da)) / (2 * dc);
    c.x = ax + x * dx + y * dy;
    c.y = ay + x * dy - y * dx;
  } else {
    c.x = ax + db;
    c.y = ay;
  }
}

function intersects(a, b) {
  var dx = b.x - a.x,
      dy = b.y - a.y,
      dr = a.r + b.r;
  return dr * dr > dx * dx + dy * dy;
}

function distance2(circle, x, y) {
  var dx = circle.x - x,
      dy = circle.y - y;
  return dx * dx + dy * dy;
}

function Node$1(circle) {
  this._ = circle;
  this.next = null;
  this.previous = null;
}

function packEnclose(circles) {
  if (!(n = circles.length)) return 0;

  var a, b, c, n;

  // Place the first circle.
  a = circles[0], a.x = 0, a.y = 0;
  if (!(n > 1)) return a.r;

  // Place the second circle.
  b = circles[1], a.x = -b.r, b.x = a.r, b.y = 0;
  if (!(n > 2)) return a.r + b.r;

  // Place the third circle.
  place(b, a, c = circles[2]);

  // Initialize the weighted centroid.
  var aa = a.r * a.r,
      ba = b.r * b.r,
      ca = c.r * c.r,
      oa = aa + ba + ca,
      ox = aa * a.x + ba * b.x + ca * c.x,
      oy = aa * a.y + ba * b.y + ca * c.y,
      cx, cy, i, j, k, sj, sk;

  // Initialize the front-chain using the first three circles a, b and c.
  a = new Node$1(a), b = new Node$1(b), c = new Node$1(c);
  a.next = c.previous = b;
  b.next = a.previous = c;
  c.next = b.previous = a;

  // Attempt to place each remaining circle…
  pack: for (i = 3; i < n; ++i) {
    place(a._, b._, c = circles[i]), c = new Node$1(c);

    // If there are only three elements in the front-chain…
    if ((k = a.previous) === (j = b.next)) {
      // If the new circle intersects the third circle,
      // rotate the front chain to try the next position.
      if (intersects(j._, c._)) {
        a = b, b = j, --i;
        continue pack;
      }
    }

    // Find the closest intersecting circle on the front-chain, if any.
    else {
      sj = j._.r, sk = k._.r;
      do {
        if (sj <= sk) {
          if (intersects(j._, c._)) {
            b = j, a.next = b, b.previous = a, --i;
            continue pack;
          }
          j = j.next, sj += j._.r;
        } else {
          if (intersects(k._, c._)) {
            a = k, a.next = b, b.previous = a, --i;
            continue pack;
          }
          k = k.previous, sk += k._.r;
        }
      } while (j !== k.next);
    }

    // Success! Insert the new circle c between a and b.
    c.previous = a, c.next = b, a.next = b.previous = b = c;

    // Update the weighted centroid.
    oa += ca = c._.r * c._.r;
    ox += ca * c._.x;
    oy += ca * c._.y;

    // Compute the new closest circle a to centroid.
    aa = distance2(a._, cx = ox / oa, cy = oy / oa);
    while ((c = c.next) !== b) {
      if ((ca = distance2(c._, cx, cy)) < aa) {
        a = c, aa = ca;
      }
    }
    b = a.next;
  }

  // Compute the enclosing circle of the front chain.
  a = [b._], c = b; while ((c = c.next) !== b) a.push(c._); c = enclose(a);

  // Translate the circles to put the enclosing circle around the origin.
  for (i = 0; i < n; ++i) a = circles[i], a.x -= c.x, a.y -= c.y;

  return c.r;
}

function optional(f) {
  return f == null ? null : required(f);
}

function required(f) {
  if (typeof f !== "function") throw new Error;
  return f;
}

function constantZero() {
  return 0;
}

function constant$6(x) {
  return function() {
    return x;
  };
}

function defaultRadius(d) {
  return Math.sqrt(d.value);
}

function pack$1() {
  var radius = null,
      dx = 1,
      dy = 1,
      padding = constantZero;

  function pack(root) {
    root.x = dx / 2, root.y = dy / 2;
    if (radius) {
      root.eachBefore(radiusLeaf(radius))
          .eachAfter(packChildren(padding, 0.5))
          .eachBefore(translateChild(1));
    } else {
      root.eachBefore(radiusLeaf(defaultRadius))
          .eachAfter(packChildren(constantZero, 1))
          .eachAfter(packChildren(padding, root.r / Math.min(dx, dy)))
          .eachBefore(translateChild(Math.min(dx, dy) / (2 * root.r)));
    }
    return root;
  }

  pack.radius = function(x) {
    return arguments.length ? (radius = optional(x), pack) : radius;
  };

  pack.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], pack) : [dx, dy];
  };

  pack.padding = function(x) {
    return arguments.length ? (padding = typeof x === "function" ? x : constant$6(+x), pack) : padding;
  };

  return pack;
}

function radiusLeaf(radius) {
  return function(node) {
    if (!node.children) {
      node.r = Math.max(0, +radius(node) || 0);
    }
  };
}

function packChildren(padding, k) {
  return function(node) {
    if (children = node.children) {
      var children,
          i,
          n = children.length,
          r = padding(node) * k || 0,
          e;

      if (r) for (i = 0; i < n; ++i) children[i].r += r;
      e = packEnclose(children);
      if (r) for (i = 0; i < n; ++i) children[i].r -= r;
      node.r = e + r;
    }
  };
}

function translateChild(k) {
  return function(node) {
    var parent = node.parent;
    node.r *= k;
    if (parent) {
      node.x = parent.x + k * node.x;
      node.y = parent.y + k * node.y;
    }
  };
}

function roundNode(node) {
  node.x0 = Math.round(node.x0);
  node.y0 = Math.round(node.y0);
  node.x1 = Math.round(node.x1);
  node.y1 = Math.round(node.y1);
}

function treemapDice(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      node,
      i = -1,
      n = nodes.length,
      k = parent.value && (x1 - x0) / parent.value;

  while (++i < n) {
    node = nodes[i], node.y0 = y0, node.y1 = y1;
    node.x0 = x0, node.x1 = x0 += node.value * k;
  }
}

function partition$2() {
  var dx = 1,
      dy = 1,
      padding = 0,
      round = false;

  function partition(root) {
    var n = root.height + 1;
    root.x0 =
    root.y0 = padding;
    root.x1 = dx;
    root.y1 = dy / n;
    root.eachBefore(positionNode(dy, n));
    if (round) root.eachBefore(roundNode);
    return root;
  }

  function positionNode(dy, n) {
    return function(node) {
      if (node.children) {
        treemapDice(node, node.x0, dy * (node.depth + 1) / n, node.x1, dy * (node.depth + 2) / n);
      }
      var x0 = node.x0,
          y0 = node.y0,
          x1 = node.x1 - padding,
          y1 = node.y1 - padding;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      node.x0 = x0;
      node.y0 = y0;
      node.x1 = x1;
      node.y1 = y1;
    };
  }

  partition.round = function(x) {
    return arguments.length ? (round = !!x, partition) : round;
  };

  partition.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], partition) : [dx, dy];
  };

  partition.padding = function(x) {
    return arguments.length ? (padding = +x, partition) : padding;
  };

  return partition;
}

var keyPrefix = "$";
var preroot = {depth: -1};
var ambiguous = {};
function defaultId(d) {
  return d.id;
}

function defaultParentId(d) {
  return d.parentId;
}

function stratify() {
  var id = defaultId,
      parentId = defaultParentId;

  function stratify(data) {
    var d,
        i,
        n = data.length,
        root,
        parent,
        node,
        nodes = new Array(n),
        nodeId,
        nodeKey,
        nodeByKey = {};

    for (i = 0; i < n; ++i) {
      d = data[i], node = nodes[i] = new Node(d);
      if ((nodeId = id(d, i, data)) != null && (nodeId += "")) {
        nodeKey = keyPrefix + (node.id = nodeId);
        nodeByKey[nodeKey] = nodeKey in nodeByKey ? ambiguous : node;
      }
    }

    for (i = 0; i < n; ++i) {
      node = nodes[i], nodeId = parentId(data[i], i, data);
      if (nodeId == null || !(nodeId += "")) {
        if (root) throw new Error("multiple roots");
        root = node;
      } else {
        parent = nodeByKey[keyPrefix + nodeId];
        if (!parent) throw new Error("missing: " + nodeId);
        if (parent === ambiguous) throw new Error("ambiguous: " + nodeId);
        if (parent.children) parent.children.push(node);
        else parent.children = [node];
        node.parent = parent;
      }
    }

    if (!root) throw new Error("no root");
    root.parent = preroot;
    root.eachBefore(function(node) { node.depth = node.parent.depth + 1; --n; }).eachBefore(computeHeight);
    root.parent = null;
    if (n > 0) throw new Error("cycle");

    return root;
  }

  stratify.id = function(x) {
    return arguments.length ? (id = required(x), stratify) : id;
  };

  stratify.parentId = function(x) {
    return arguments.length ? (parentId = required(x), stratify) : parentId;
  };

  return stratify;
}

function defaultSeparation$1(a, b) {
  return a.parent === b.parent ? 1 : 2;
}

// function radialSeparation(a, b) {
//   return (a.parent === b.parent ? 1 : 2) / a.depth;
// }

// This function is used to traverse the left contour of a subtree (or
// subforest). It returns the successor of v on this contour. This successor is
// either given by the leftmost child of v or by the thread of v. The function
// returns null if and only if v is on the highest level of its subtree.
function nextLeft(v) {
  var children = v.children;
  return children ? children[0] : v.t;
}

// This function works analogously to nextLeft.
function nextRight(v) {
  var children = v.children;
  return children ? children[children.length - 1] : v.t;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}

// All other shifts, applied to the smaller subtrees between w- and w+, are
// performed by this function. To prepare the shifts, we have to adjust
// change(w+), shift(w+), and change(w-).
function executeShifts(v) {
  var shift = 0,
      change = 0,
      children = v.children,
      i = children.length,
      w;
  while (--i >= 0) {
    w = children[i];
    w.z += shift;
    w.m += shift;
    shift += w.s + (change += w.c);
  }
}

// If vi-’s ancestor is a sibling of v, returns vi-’s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim, v, ancestor) {
  return vim.a.parent === v.parent ? vim.a : ancestor;
}

function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null; // default ancestor
  this.a = this; // ancestor
  this.z = 0; // prelim
  this.m = 0; // mod
  this.c = 0; // change
  this.s = 0; // shift
  this.t = null; // thread
  this.i = i; // number
}

TreeNode.prototype = Object.create(Node.prototype);

function treeRoot(root) {
  var tree = new TreeNode(root, 0),
      node,
      nodes = [tree],
      child,
      children,
      i,
      n;

  while (node = nodes.pop()) {
    if (children = node._.children) {
      node.children = new Array(n = children.length);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new TreeNode(children[i], i));
        child.parent = node;
      }
    }
  }

  (tree.parent = new TreeNode(null, 0)).children = [tree];
  return tree;
}

// Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
function tree() {
  var separation = defaultSeparation$1,
      dx = 1,
      dy = 1,
      nodeSize = null;

  function tree(root) {
    var t = treeRoot(root);

    // Compute the layout using Buchheim et al.’s algorithm.
    t.eachAfter(firstWalk), t.parent.m = -t.z;
    t.eachBefore(secondWalk);

    // If a fixed node size is specified, scale x and y.
    if (nodeSize) root.eachBefore(sizeNode);

    // If a fixed tree size is specified, scale x and y based on the extent.
    // Compute the left-most, right-most, and depth-most nodes for extents.
    else {
      var left = root,
          right = root,
          bottom = root;
      root.eachBefore(function(node) {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
        if (node.depth > bottom.depth) bottom = node;
      });
      var s = left === right ? 1 : separation(left, right) / 2,
          tx = s - left.x,
          kx = dx / (right.x + s + tx),
          ky = dy / (bottom.depth || 1);
      root.eachBefore(function(node) {
        node.x = (node.x + tx) * kx;
        node.y = node.depth * ky;
      });
    }

    return root;
  }

  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  function firstWalk(v) {
    var children = v.children,
        siblings = v.parent.children,
        w = v.i ? siblings[v.i - 1] : null;
    if (children) {
      executeShifts(v);
      var midpoint = (children[0].z + children[children.length - 1].z) / 2;
      if (w) {
        v.z = w.z + separation(v._, w._);
        v.m = v.z - midpoint;
      } else {
        v.z = midpoint;
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._);
    }
    v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
  }

  // Computes all real x-coordinates by summing up the modifiers recursively.
  function secondWalk(v) {
    v._.x = v.z + v.parent.m;
    v.m += v.parent.m;
  }

  // The core of the algorithm. Here, a new subtree is combined with the
  // previous subtrees. Threads are used to traverse the inside and outside
  // contours of the left and right subtree up to the highest common level. The
  // vertices used for the traversals are vi+, vi-, vo-, and vo+, where the
  // superscript o means outside and i means inside, the subscript - means left
  // subtree and + means right subtree. For summing up the modifiers along the
  // contour, we use respective variables si+, si-, so-, and so+. Whenever two
  // nodes of the inside contours conflict, we compute the left one of the
  // greatest uncommon ancestors using the function ANCESTOR and call MOVE
  // SUBTREE to shift the subtree and prepare the shifts of smaller subtrees.
  // Finally, we add a new thread (if necessary).
  function apportion(v, w, ancestor) {
    if (w) {
      var vip = v,
          vop = v,
          vim = w,
          vom = vip.parent.children[0],
          sip = vip.m,
          sop = vop.m,
          sim = vim.m,
          som = vom.m,
          shift;
      while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
        vom = nextLeft(vom);
        vop = nextRight(vop);
        vop.a = v;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v;
      }
    }
    return ancestor;
  }

  function sizeNode(node) {
    node.x *= dx;
    node.y = node.depth * dy;
  }

  tree.separation = function(x) {
    return arguments.length ? (separation = x, tree) : separation;
  };

  tree.size = function(x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], tree) : (nodeSize ? null : [dx, dy]);
  };

  tree.nodeSize = function(x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], tree) : (nodeSize ? [dx, dy] : null);
  };

  return tree;
}

function treemapSlice(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      node,
      i = -1,
      n = nodes.length,
      k = parent.value && (y1 - y0) / parent.value;

  while (++i < n) {
    node = nodes[i], node.x0 = x0, node.x1 = x1;
    node.y0 = y0, node.y1 = y0 += node.value * k;
  }
}

var phi = (1 + Math.sqrt(5)) / 2;

function squarifyRatio(ratio, parent, x0, y0, x1, y1) {
  var rows = [],
      nodes = parent.children,
      row,
      nodeValue,
      i0 = 0,
      i1,
      n = nodes.length,
      dx, dy,
      value = parent.value,
      sumValue,
      minValue,
      maxValue,
      newRatio,
      minRatio,
      alpha,
      beta;

  while (i0 < n) {
    dx = x1 - x0, dy = y1 - y0;
    minValue = maxValue = sumValue = nodes[i0].value;
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio);
    beta = sumValue * sumValue * alpha;
    minRatio = Math.max(maxValue / beta, beta / minValue);

    // Keep adding nodes while the aspect ratio maintains or improves.
    for (i1 = i0 + 1; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) { sumValue -= nodeValue; break; }
      minRatio = newRatio;
    }

    // Position and record the row orientation.
    rows.push(row = {value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1)});
    if (row.dice) treemapDice(row, x0, y0, x1, value ? y0 += dy * sumValue / value : y1);
    else treemapSlice(row, x0, y0, value ? x0 += dx * sumValue / value : x1, y1);
    value -= sumValue, i0 = i1;
  }

  return rows;
}

var treemapSquarify = (function custom(ratio) {

  function squarify(parent, x0, y0, x1, y1) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1);
  }

  squarify.ratio = function(x) {
    return custom((x = +x) > 1 ? x : 1);
  };

  return squarify;
})(phi);

function treemap() {
  var tile = treemapSquarify,
      round = false,
      dx = 1,
      dy = 1,
      paddingStack = [0],
      paddingInner = constantZero,
      paddingTop = constantZero,
      paddingRight = constantZero,
      paddingBottom = constantZero,
      paddingLeft = constantZero;

  function treemap(root) {
    root.x0 =
    root.y0 = 0;
    root.x1 = dx;
    root.y1 = dy;
    root.eachBefore(positionNode);
    paddingStack = [0];
    if (round) root.eachBefore(roundNode);
    return root;
  }

  function positionNode(node) {
    var p = paddingStack[node.depth],
        x0 = node.x0 + p,
        y0 = node.y0 + p,
        x1 = node.x1 - p,
        y1 = node.y1 - p;
    if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
    if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
    node.x0 = x0;
    node.y0 = y0;
    node.x1 = x1;
    node.y1 = y1;
    if (node.children) {
      p = paddingStack[node.depth + 1] = paddingInner(node) / 2;
      x0 += paddingLeft(node) - p;
      y0 += paddingTop(node) - p;
      x1 -= paddingRight(node) - p;
      y1 -= paddingBottom(node) - p;
      if (x1 < x0) x0 = x1 = (x0 + x1) / 2;
      if (y1 < y0) y0 = y1 = (y0 + y1) / 2;
      tile(node, x0, y0, x1, y1);
    }
  }

  treemap.round = function(x) {
    return arguments.length ? (round = !!x, treemap) : round;
  };

  treemap.size = function(x) {
    return arguments.length ? (dx = +x[0], dy = +x[1], treemap) : [dx, dy];
  };

  treemap.tile = function(x) {
    return arguments.length ? (tile = required(x), treemap) : tile;
  };

  treemap.padding = function(x) {
    return arguments.length ? treemap.paddingInner(x).paddingOuter(x) : treemap.paddingInner();
  };

  treemap.paddingInner = function(x) {
    return arguments.length ? (paddingInner = typeof x === "function" ? x : constant$6(+x), treemap) : paddingInner;
  };

  treemap.paddingOuter = function(x) {
    return arguments.length ? treemap.paddingTop(x).paddingRight(x).paddingBottom(x).paddingLeft(x) : treemap.paddingTop();
  };

  treemap.paddingTop = function(x) {
    return arguments.length ? (paddingTop = typeof x === "function" ? x : constant$6(+x), treemap) : paddingTop;
  };

  treemap.paddingRight = function(x) {
    return arguments.length ? (paddingRight = typeof x === "function" ? x : constant$6(+x), treemap) : paddingRight;
  };

  treemap.paddingBottom = function(x) {
    return arguments.length ? (paddingBottom = typeof x === "function" ? x : constant$6(+x), treemap) : paddingBottom;
  };

  treemap.paddingLeft = function(x) {
    return arguments.length ? (paddingLeft = typeof x === "function" ? x : constant$6(+x), treemap) : paddingLeft;
  };

  return treemap;
}

function treemapBinary(parent, x0, y0, x1, y1) {
  var nodes = parent.children,
      i, n = nodes.length,
      sum, sums = new Array(n + 1);

  for (sums[0] = sum = i = 0; i < n; ++i) {
    sums[i + 1] = sum += nodes[i].value;
  }

  partition(0, n, parent.value, x0, y0, x1, y1);

  function partition(i, j, value, x0, y0, x1, y1) {
    if (i >= j - 1) {
      var node = nodes[i];
      node.x0 = x0, node.y0 = y0;
      node.x1 = x1, node.y1 = y1;
      return;
    }

    var valueOffset = sums[i],
        valueTarget = (value / 2) + valueOffset,
        k = i + 1,
        hi = j - 1;

    while (k < hi) {
      var mid = k + hi >>> 1;
      if (sums[mid] < valueTarget) k = mid + 1;
      else hi = mid;
    }

    var valueLeft = sums[k] - valueOffset,
        valueRight = value - valueLeft;

    if ((y1 - y0) > (x1 - x0)) {
      var yk = (y0 * valueRight + y1 * valueLeft) / value;
      partition(i, k, valueLeft, x0, y0, x1, yk);
      partition(k, j, valueRight, x0, yk, x1, y1);
    } else {
      var xk = (x0 * valueRight + x1 * valueLeft) / value;
      partition(i, k, valueLeft, x0, y0, xk, y1);
      partition(k, j, valueRight, xk, y0, x1, y1);
    }
  }
}

function treemapSliceDice(parent, x0, y0, x1, y1) {
  (parent.depth & 1 ? treemapSlice : treemapDice)(parent, x0, y0, x1, y1);
}

var treemapResquarify = (function custom(ratio) {

  function resquarify(parent, x0, y0, x1, y1) {
    if ((rows = parent._squarify) && (rows.ratio === ratio)) {
      var rows,
          row,
          nodes,
          i,
          j = -1,
          n,
          m = rows.length,
          value = parent.value;

      while (++j < m) {
        row = rows[j], nodes = row.children;
        for (i = row.value = 0, n = nodes.length; i < n; ++i) row.value += nodes[i].value;
        if (row.dice) treemapDice(row, x0, y0, x1, y0 += (y1 - y0) * row.value / value);
        else treemapSlice(row, x0, y0, x0 += (x1 - x0) * row.value / value, y1);
        value -= row.value;
      }
    } else {
      parent._squarify = rows = squarifyRatio(ratio, parent, x0, y0, x1, y1);
      rows.ratio = ratio;
    }
  }

  resquarify.ratio = function(x) {
    return custom((x = +x) > 1 ? x : 1);
  };

  return resquarify;
})(phi);

/**
  * Nest tuples into a tree structure, grouped by key values.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {Array<function(object): *>} params.keys - The key fields to nest by, in order.
  */
function Nest(params) {
  Transform.call(this, null, params);
}

var prototype$46 = inherits(Nest, Transform);

function children(n) {
  return n.values;
}

prototype$46.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Nest transform requires an upstream data source.');
  }

  if (!this.value || _.modified() || pulse.changed()) {
    var root = array$1(_.keys)
      .reduce(function(n, k) { return (n.key(k), n)}, nest())
      .entries(pulse.source);

    var tree = hierarchy({values: root}, children),
        map = tree.lookup = {};
    tree.each(function(node) { if ('_id' in node.data) map[node.data._id] = node; });
    this.value = tree;
  }

  pulse.source.root = this.value;
};

/**
  * Stratify a collection of tuples into a tree structure based on
  * id and parent id fields.
  * @constructor
  * @param {object} params - The parameters for this operator.
  * @param {function(object): *} params.key - Unique key field for each tuple.
  * @param {function(object): *} params.parentKey - Field with key for parent tuple.
  */
function Stratify(params) {
  Transform.call(this, null, params);
}

var prototype$47 = inherits(Stratify, Transform);

prototype$47.transform = function(_, pulse) {
  if (!pulse.source) {
    error('Stratify transform requires an upstream data source.');
  }

  var run = !this.value
         || _.modified()
         || pulse.changed(pulse.ADD_REM)
         || pulse.modified(_.key.fields)
         || pulse.modified(_.parentKey.fields);

  if (run) {
    var tree = stratify().id(_.key).parentId(_.parentKey)(pulse.source),
        map = tree.lookup = {};
    tree.each(function(node) { map[node.data._id] = node; });
    this.value = tree;
  }

  pulse.source.root = this.value;
};

/**
  * Generate tuples representing links between tree nodes.
  * The resulting tuples will contain 'source' and 'target' fields,
  * which point to parent and child node tuples, respectively.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
function TreeLinks(params) {
  Transform.call(this, {}, params);
}

var prototype$48 = inherits(TreeLinks, Transform);

function parentTuple(node) {
  var p;
  return node.parent
      && (p=node.parent.data)
      && '_id' in p && p;
}

prototype$48.transform = function(_, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error('TreeLinks transform requires a backing tree data source.');
  }

  var root = pulse.source.root,
      nodes = root.lookup,
      links = this.value,
      mods = {},
      out = pulse.fork();

  function modify(id) {
    var link = links[id];
    if (link) mods[id] = 1, out.mod.push(link);
  }

  // process removed tuples
  // assumes that if a parent node is removed the child will be, too.
  pulse.visit(pulse.REM, function(t) {
    var link = links[t._id];
    if (link) delete links[t._id], out.rem.push(link);
  });

  // create new link instances for added nodes with valid parents
  pulse.visit(pulse.ADD, function(t) {
    var id = t._id, p;
    if (p = parentTuple(nodes[id])) {
      out.add.push(links[id] = ingest({source: p, target: t}));
      mods[id] = 1;
    }
  });

  // process modified nodes and their children
  pulse.visit(pulse.MOD, function(t) {
    var id = t._id,
        node = nodes[id],
        kids = node.children;

    modify(id);
    if (kids) for (var i=0, n=kids.length; i<n; ++i) {
      if (!mods[(id=kids[i].data._id)]) modify(id);
    }
  });

  return out;
};

var Tiles = {
  binary: treemapBinary,
  dice: treemapDice,
  slice: treemapSlice,
  slicedice: treemapSliceDice,
  squarify: treemapSquarify,
  resquarify: treemapResquarify
};

var Layouts = {
  tidy: tree,
  cluster: cluster
};

/**
 * Tree layout generator. Supports both 'tidy' and 'cluster' layouts.
 */
function treeLayout(method) {
  var m = method || 'tidy';
  if (Layouts.hasOwnProperty(m)) return Layouts[m]();
  else error('Unrecognized Tree layout method: ' + m);
}

/**
 * Treemap layout generator. Adds 'method' and 'ratio' parameters
 * to configure the underlying tile method.
 */
function treemapLayout() {
  var x = treemap();
  x.ratio = function(_) {
    var t = x.tile();
    if (t.ratio) x.tile(t.ratio(_));
  };
  x.method = function(_) {
    if (Tiles.hasOwnProperty(_)) x.tile(Tiles[_]);
    else error('Unrecognized Treemap layout method: ' + _);
  };
  return x;
}

 /**
  * Abstract class for tree layout.
  * @constructor
  * @param {object} params - The parameters for this operator.
  */
function HierarchyLayout(params) {
  Transform.call(this, null, params);
}

var prototype$49 = inherits(HierarchyLayout, Transform);

prototype$49.transform = function(_, pulse) {
  if (!pulse.source || !pulse.source.root) {
    error(this.constructor.name
      + ' transform requires a backing tree data source.');
  }

  var layout = this.layout(_.method),
      fields = this.fields,
      root = pulse.source.root,
      as = _.as || fields;

  if (_.field) root.sum(_.field);
  if (_.sort) root.sort(_.sort);

  setParams(layout, this.params, _);
  try {
    this.value = layout(root);
  } catch (err) {
    error(err);
  }
  root.each(function(node) { setFields(node, fields, as); });

  return pulse.reflow().modifies(as).modifies('leaf');
};

function setParams(layout, params, _) {
  for (var p, i=0, n=params.length; i<n; ++i) {
    p = params[i];
    if (p in _) layout[p](_[p]);
  }
}

function setFields(node, fields, as) {
  var t = node.data;
  for (var i=0, n=fields.length-1; i<n; ++i) {
    t[as[i]] = node[fields[i]];
  }
  t[as[n]] = node.children ? node.children.length : 0;
}

/**
 * Tree layout. Depending on the method parameter, performs either
 * Reingold-Tilford 'tidy' layout or dendrogram 'cluster' layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 */
function Tree(params) {
  HierarchyLayout.call(this, params);
}
inherits(Tree, HierarchyLayout);
Tree.prototype.layout = treeLayout;
Tree.prototype.params = ['size', 'nodeSize', 'separation'];
Tree.prototype.fields = ['x', 'y', 'depth', 'children'];

/**
 * Treemap layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Treemap(params) {
  HierarchyLayout.call(this, params);
}
inherits(Treemap, HierarchyLayout);
Treemap.prototype.layout = treemapLayout;
Treemap.prototype.params = [
  'method', 'ratio', 'size', 'round',
  'padding', 'paddingInner', 'paddingOuter',
  'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'
];
Treemap.prototype.fields = ['x0', 'y0', 'x1', 'y1', 'depth', 'children'];

/**
 * Partition tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Partition(params) {
  HierarchyLayout.call(this, params);
}
inherits(Partition, HierarchyLayout);
Partition.prototype.layout = partition$2;
Partition.prototype.params = ['size', 'round', 'padding'];
Partition.prototype.fields = Treemap.prototype.fields;

/**
 * Packed circle tree layout.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {function(object): *} params.field - The value field to size nodes.
 */
function Pack(params) {
  HierarchyLayout.call(this, params);
}
inherits(Pack, HierarchyLayout);
Pack.prototype.layout = pack$1;
Pack.prototype.params = ['size', 'padding'];
Pack.prototype.fields = ['x', 'y', 'r', 'depth', 'children'];

var NestDefinition = {
  "type": "Nest",
  "metadata": {"treesource": true},
  "params": [
    { "name": "keys", "type": "field", "array": true }
  ]
};

var StratifyDefinition = {
  "type": "Stratify",
  "metadata": {"treesource": true},
  "params": [
    { "name": "key", "type": "field", "required": true },
    { "name": "parentKey", "type": "field", "required": true  }
  ]
};

var TreeLinksDefinition = {
  "type": "TreeLinks",
  "metadata": {"tree": true, "generates": true, "changes": true},
  "params": []
}

var PackDefinition = {
  "type": "Pack",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "radius", "type": "field", "default": null },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 3, "default": ["x", "y", "r", "depth", "children"] }
  ]
};

var PartitionDefinition = {
  "type": "Partition",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": ["x0", "y0", "x1", "y1", "depth", "children"] }
  ]
};

var TreeDefinition = {
  "type": "Tree",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "method", "type": "enum", "default": "tidy", "values": ["tidy", "cluster"] },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "nodeSize", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": ["x", "y", "depth", "children"] }
  ]
};

var TreemapDefinition = {
  "type": "Treemap",
  "metadata": {"tree": true, "modifies": true},
  "params": [
    { "name": "field", "type": "field" },
    { "name": "sort", "type": "compare" },
    { "name": "method", "type": "enum", "default": "squarify",
      "values": ["squarify", "resquarify", "binary", "dice", "slice", "slicedice"] },
    { "name": "padding", "type": "number", "default": 0 },
    { "name": "paddingInner", "type": "number", "default": 0 },
    { "name": "paddingOuter", "type": "number", "default": 0 },
    { "name": "paddingTop", "type": "number", "default": 0 },
    { "name": "paddingRight", "type": "number", "default": 0 },
    { "name": "paddingBottom", "type": "number", "default": 0 },
    { "name": "paddingLeft", "type": "number", "default": 0 },
    { "name": "ratio", "type": "number", "default": 1.618033988749895 },
    { "name": "round", "type": "boolean", "default": false },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "as", "type": "string", "array": true, "length": 4, "default": ["x0", "y0", "x1", "y1", "depth", "children"] }
  ]
};

register(NestDefinition, Nest);
register(StratifyDefinition, Stratify);
register(TreeLinksDefinition, TreeLinks);
register(PackDefinition, Pack);
register(PartitionDefinition, Partition);
register(TreeDefinition, Tree);
register(TreemapDefinition, Treemap);

function constant$7(x) {
  return function() {
    return x;
  };
}

function x$2(d) {
  return d[0];
}

function y$2(d) {
  return d[1];
}

function RedBlackTree() {
  this._ = null; // root node
}

function RedBlackNode(node) {
  node.U = // parent node
  node.C = // color - true for red, false for black
  node.L = // left node
  node.R = // right node
  node.P = // previous node
  node.N = null; // next node
}

RedBlackTree.prototype = {
  constructor: RedBlackTree,

  insert: function(after, node) {
    var parent, grandpa, uncle;

    if (after) {
      node.P = after;
      node.N = after.N;
      if (after.N) after.N.P = node;
      after.N = node;
      if (after.R) {
        after = after.R;
        while (after.L) after = after.L;
        after.L = node;
      } else {
        after.R = node;
      }
      parent = after;
    } else if (this._) {
      after = RedBlackFirst(this._);
      node.P = null;
      node.N = after;
      after.P = after.L = node;
      parent = after;
    } else {
      node.P = node.N = null;
      this._ = node;
      parent = null;
    }
    node.L = node.R = null;
    node.U = parent;
    node.C = true;

    after = node;
    while (parent && parent.C) {
      grandpa = parent.U;
      if (parent === grandpa.L) {
        uncle = grandpa.R;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.R) {
            RedBlackRotateLeft(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateRight(this, grandpa);
        }
      } else {
        uncle = grandpa.L;
        if (uncle && uncle.C) {
          parent.C = uncle.C = false;
          grandpa.C = true;
          after = grandpa;
        } else {
          if (after === parent.L) {
            RedBlackRotateRight(this, parent);
            after = parent;
            parent = after.U;
          }
          parent.C = false;
          grandpa.C = true;
          RedBlackRotateLeft(this, grandpa);
        }
      }
      parent = after.U;
    }
    this._.C = false;
  },

  remove: function(node) {
    if (node.N) node.N.P = node.P;
    if (node.P) node.P.N = node.N;
    node.N = node.P = null;

    var parent = node.U,
        sibling,
        left = node.L,
        right = node.R,
        next,
        red;

    if (!left) next = right;
    else if (!right) next = left;
    else next = RedBlackFirst(right);

    if (parent) {
      if (parent.L === node) parent.L = next;
      else parent.R = next;
    } else {
      this._ = next;
    }

    if (left && right) {
      red = next.C;
      next.C = node.C;
      next.L = left;
      left.U = next;
      if (next !== right) {
        parent = next.U;
        next.U = node.U;
        node = next.R;
        parent.L = node;
        next.R = right;
        right.U = next;
      } else {
        next.U = parent;
        parent = next;
        node = next.R;
      }
    } else {
      red = node.C;
      node = next;
    }

    if (node) node.U = parent;
    if (red) return;
    if (node && node.C) { node.C = false; return; }

    do {
      if (node === this._) break;
      if (node === parent.L) {
        sibling = parent.R;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateLeft(this, parent);
          sibling = parent.R;
        }
        if ((sibling.L && sibling.L.C)
            || (sibling.R && sibling.R.C)) {
          if (!sibling.R || !sibling.R.C) {
            sibling.L.C = false;
            sibling.C = true;
            RedBlackRotateRight(this, sibling);
            sibling = parent.R;
          }
          sibling.C = parent.C;
          parent.C = sibling.R.C = false;
          RedBlackRotateLeft(this, parent);
          node = this._;
          break;
        }
      } else {
        sibling = parent.L;
        if (sibling.C) {
          sibling.C = false;
          parent.C = true;
          RedBlackRotateRight(this, parent);
          sibling = parent.L;
        }
        if ((sibling.L && sibling.L.C)
          || (sibling.R && sibling.R.C)) {
          if (!sibling.L || !sibling.L.C) {
            sibling.R.C = false;
            sibling.C = true;
            RedBlackRotateLeft(this, sibling);
            sibling = parent.L;
          }
          sibling.C = parent.C;
          parent.C = sibling.L.C = false;
          RedBlackRotateRight(this, parent);
          node = this._;
          break;
        }
      }
      sibling.C = true;
      node = parent;
      parent = parent.U;
    } while (!node.C);

    if (node) node.C = false;
  }
};

function RedBlackRotateLeft(tree, node) {
  var p = node,
      q = node.R,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.R = q.L;
  if (p.R) p.R.U = p;
  q.L = p;
}

function RedBlackRotateRight(tree, node) {
  var p = node,
      q = node.L,
      parent = p.U;

  if (parent) {
    if (parent.L === p) parent.L = q;
    else parent.R = q;
  } else {
    tree._ = q;
  }

  q.U = parent;
  p.U = q;
  p.L = q.R;
  if (p.L) p.L.U = p;
  q.R = p;
}

function RedBlackFirst(node) {
  while (node.L) node = node.L;
  return node;
}

function createEdge(left, right, v0, v1) {
  var edge = [null, null],
      index = edges.push(edge) - 1;
  edge.left = left;
  edge.right = right;
  if (v0) setEdgeEnd(edge, left, right, v0);
  if (v1) setEdgeEnd(edge, right, left, v1);
  cells[left.index].halfedges.push(index);
  cells[right.index].halfedges.push(index);
  return edge;
}

function createBorderEdge(left, v0, v1) {
  var edge = [v0, v1];
  edge.left = left;
  return edge;
}

function setEdgeEnd(edge, left, right, vertex) {
  if (!edge[0] && !edge[1]) {
    edge[0] = vertex;
    edge.left = left;
    edge.right = right;
  } else if (edge.left === right) {
    edge[1] = vertex;
  } else {
    edge[0] = vertex;
  }
}

// Liang–Barsky line clipping.
function clipEdge(edge, x0, y0, x1, y1) {
  var a = edge[0],
      b = edge[1],
      ax = a[0],
      ay = a[1],
      bx = b[0],
      by = b[1],
      t0 = 0,
      t1 = 1,
      dx = bx - ax,
      dy = by - ay,
      r;

  r = x0 - ax;
  if (!dx && r > 0) return;
  r /= dx;
  if (dx < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dx > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = x1 - ax;
  if (!dx && r < 0) return;
  r /= dx;
  if (dx < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dx > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  r = y0 - ay;
  if (!dy && r > 0) return;
  r /= dy;
  if (dy < 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  } else if (dy > 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  }

  r = y1 - ay;
  if (!dy && r < 0) return;
  r /= dy;
  if (dy < 0) {
    if (r > t1) return;
    if (r > t0) t0 = r;
  } else if (dy > 0) {
    if (r < t0) return;
    if (r < t1) t1 = r;
  }

  if (!(t0 > 0) && !(t1 < 1)) return true; // TODO Better check?

  if (t0 > 0) edge[0] = [ax + t0 * dx, ay + t0 * dy];
  if (t1 < 1) edge[1] = [ax + t1 * dx, ay + t1 * dy];
  return true;
}

function connectEdge(edge, x0, y0, x1, y1) {
  var v1 = edge[1];
  if (v1) return true;

  var v0 = edge[0],
      left = edge.left,
      right = edge.right,
      lx = left[0],
      ly = left[1],
      rx = right[0],
      ry = right[1],
      fx = (lx + rx) / 2,
      fy = (ly + ry) / 2,
      fm,
      fb;

  if (ry === ly) {
    if (fx < x0 || fx >= x1) return;
    if (lx > rx) {
      if (!v0) v0 = [fx, y0];
      else if (v0[1] >= y1) return;
      v1 = [fx, y1];
    } else {
      if (!v0) v0 = [fx, y1];
      else if (v0[1] < y0) return;
      v1 = [fx, y0];
    }
  } else {
    fm = (lx - rx) / (ry - ly);
    fb = fy - fm * fx;
    if (fm < -1 || fm > 1) {
      if (lx > rx) {
        if (!v0) v0 = [(y0 - fb) / fm, y0];
        else if (v0[1] >= y1) return;
        v1 = [(y1 - fb) / fm, y1];
      } else {
        if (!v0) v0 = [(y1 - fb) / fm, y1];
        else if (v0[1] < y0) return;
        v1 = [(y0 - fb) / fm, y0];
      }
    } else {
      if (ly < ry) {
        if (!v0) v0 = [x0, fm * x0 + fb];
        else if (v0[0] >= x1) return;
        v1 = [x1, fm * x1 + fb];
      } else {
        if (!v0) v0 = [x1, fm * x1 + fb];
        else if (v0[0] < x0) return;
        v1 = [x0, fm * x0 + fb];
      }
    }
  }

  edge[0] = v0;
  edge[1] = v1;
  return true;
}

function clipEdges(x0, y0, x1, y1) {
  var i = edges.length,
      edge;

  while (i--) {
    if (!connectEdge(edge = edges[i], x0, y0, x1, y1)
        || !clipEdge(edge, x0, y0, x1, y1)
        || !(Math.abs(edge[0][0] - edge[1][0]) > epsilon$1
            || Math.abs(edge[0][1] - edge[1][1]) > epsilon$1)) {
      delete edges[i];
    }
  }
}

function createCell(site) {
  return cells[site.index] = {
    site: site,
    halfedges: []
  };
}

function cellHalfedgeAngle(cell, edge) {
  var site = cell.site,
      va = edge.left,
      vb = edge.right;
  if (site === vb) vb = va, va = site;
  if (vb) return Math.atan2(vb[1] - va[1], vb[0] - va[0]);
  if (site === va) va = edge[1], vb = edge[0];
  else va = edge[0], vb = edge[1];
  return Math.atan2(va[0] - vb[0], vb[1] - va[1]);
}

function cellHalfedgeStart(cell, edge) {
  return edge[+(edge.left !== cell.site)];
}

function cellHalfedgeEnd(cell, edge) {
  return edge[+(edge.left === cell.site)];
}

function sortCellHalfedges() {
  for (var i = 0, n = cells.length, cell, halfedges, j, m; i < n; ++i) {
    if ((cell = cells[i]) && (m = (halfedges = cell.halfedges).length)) {
      var index = new Array(m),
          array = new Array(m);
      for (j = 0; j < m; ++j) index[j] = j, array[j] = cellHalfedgeAngle(cell, edges[halfedges[j]]);
      index.sort(function(i, j) { return array[j] - array[i]; });
      for (j = 0; j < m; ++j) array[j] = halfedges[index[j]];
      for (j = 0; j < m; ++j) halfedges[j] = array[j];
    }
  }
}

function clipCells(x0, y0, x1, y1) {
  var nCells = cells.length,
      iCell,
      cell,
      site,
      iHalfedge,
      halfedges,
      nHalfedges,
      start,
      startX,
      startY,
      end,
      endX,
      endY,
      cover = true;

  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      site = cell.site;
      halfedges = cell.halfedges;
      iHalfedge = halfedges.length;

      // Remove any dangling clipped edges.
      while (iHalfedge--) {
        if (!edges[halfedges[iHalfedge]]) {
          halfedges.splice(iHalfedge, 1);
        }
      }

      // Insert any border edges as necessary.
      iHalfedge = 0, nHalfedges = halfedges.length;
      while (iHalfedge < nHalfedges) {
        end = cellHalfedgeEnd(cell, edges[halfedges[iHalfedge]]), endX = end[0], endY = end[1];
        start = cellHalfedgeStart(cell, edges[halfedges[++iHalfedge % nHalfedges]]), startX = start[0], startY = start[1];
        if (Math.abs(endX - startX) > epsilon$1 || Math.abs(endY - startY) > epsilon$1) {
          halfedges.splice(iHalfedge, 0, edges.push(createBorderEdge(site, end,
              Math.abs(endX - x0) < epsilon$1 && y1 - endY > epsilon$1 ? [x0, Math.abs(startX - x0) < epsilon$1 ? startY : y1]
              : Math.abs(endY - y1) < epsilon$1 && x1 - endX > epsilon$1 ? [Math.abs(startY - y1) < epsilon$1 ? startX : x1, y1]
              : Math.abs(endX - x1) < epsilon$1 && endY - y0 > epsilon$1 ? [x1, Math.abs(startX - x1) < epsilon$1 ? startY : y0]
              : Math.abs(endY - y0) < epsilon$1 && endX - x0 > epsilon$1 ? [Math.abs(startY - y0) < epsilon$1 ? startX : x0, y0]
              : null)) - 1);
          ++nHalfedges;
        }
      }

      if (nHalfedges) cover = false;
    }
  }

  // If there weren’t any edges, have the closest site cover the extent.
  // It doesn’t matter which corner of the extent we measure!
  if (cover) {
    var dx, dy, d2, dc = Infinity;

    for (iCell = 0, cover = null; iCell < nCells; ++iCell) {
      if (cell = cells[iCell]) {
        site = cell.site;
        dx = site[0] - x0;
        dy = site[1] - y0;
        d2 = dx * dx + dy * dy;
        if (d2 < dc) dc = d2, cover = cell;
      }
    }

    if (cover) {
      var v00 = [x0, y0], v01 = [x0, y1], v11 = [x1, y1], v10 = [x1, y0];
      cover.halfedges.push(
        edges.push(createBorderEdge(site = cover.site, v00, v01)) - 1,
        edges.push(createBorderEdge(site, v01, v11)) - 1,
        edges.push(createBorderEdge(site, v11, v10)) - 1,
        edges.push(createBorderEdge(site, v10, v00)) - 1
      );
    }
  }

  // Lastly delete any cells with no edges; these were entirely clipped.
  for (iCell = 0; iCell < nCells; ++iCell) {
    if (cell = cells[iCell]) {
      if (!cell.halfedges.length) {
        delete cells[iCell];
      }
    }
  }
}

var circlePool = [];

var firstCircle;

function Circle() {
  RedBlackNode(this);
  this.x =
  this.y =
  this.arc =
  this.site =
  this.cy = null;
}

function attachCircle(arc) {
  var lArc = arc.P,
      rArc = arc.N;

  if (!lArc || !rArc) return;

  var lSite = lArc.site,
      cSite = arc.site,
      rSite = rArc.site;

  if (lSite === rSite) return;

  var bx = cSite[0],
      by = cSite[1],
      ax = lSite[0] - bx,
      ay = lSite[1] - by,
      cx = rSite[0] - bx,
      cy = rSite[1] - by;

  var d = 2 * (ax * cy - ay * cx);
  if (d >= -epsilon2$2) return;

  var ha = ax * ax + ay * ay,
      hc = cx * cx + cy * cy,
      x = (cy * ha - ay * hc) / d,
      y = (ax * hc - cx * ha) / d;

  var circle = circlePool.pop() || new Circle;
  circle.arc = arc;
  circle.site = cSite;
  circle.x = x + bx;
  circle.y = (circle.cy = y + by) + Math.sqrt(x * x + y * y); // y bottom

  arc.circle = circle;

  var before = null,
      node = circles._;

  while (node) {
    if (circle.y < node.y || (circle.y === node.y && circle.x <= node.x)) {
      if (node.L) node = node.L;
      else { before = node.P; break; }
    } else {
      if (node.R) node = node.R;
      else { before = node; break; }
    }
  }

  circles.insert(before, circle);
  if (!before) firstCircle = circle;
}

function detachCircle(arc) {
  var circle = arc.circle;
  if (circle) {
    if (!circle.P) firstCircle = circle.N;
    circles.remove(circle);
    circlePool.push(circle);
    RedBlackNode(circle);
    arc.circle = null;
  }
}

var beachPool = [];

function Beach() {
  RedBlackNode(this);
  this.edge =
  this.site =
  this.circle = null;
}

function createBeach(site) {
  var beach = beachPool.pop() || new Beach;
  beach.site = site;
  return beach;
}

function detachBeach(beach) {
  detachCircle(beach);
  beaches.remove(beach);
  beachPool.push(beach);
  RedBlackNode(beach);
}

function removeBeach(beach) {
  var circle = beach.circle,
      x = circle.x,
      y = circle.cy,
      vertex = [x, y],
      previous = beach.P,
      next = beach.N,
      disappearing = [beach];

  detachBeach(beach);

  var lArc = previous;
  while (lArc.circle
      && Math.abs(x - lArc.circle.x) < epsilon$1
      && Math.abs(y - lArc.circle.cy) < epsilon$1) {
    previous = lArc.P;
    disappearing.unshift(lArc);
    detachBeach(lArc);
    lArc = previous;
  }

  disappearing.unshift(lArc);
  detachCircle(lArc);

  var rArc = next;
  while (rArc.circle
      && Math.abs(x - rArc.circle.x) < epsilon$1
      && Math.abs(y - rArc.circle.cy) < epsilon$1) {
    next = rArc.N;
    disappearing.push(rArc);
    detachBeach(rArc);
    rArc = next;
  }

  disappearing.push(rArc);
  detachCircle(rArc);

  var nArcs = disappearing.length,
      iArc;
  for (iArc = 1; iArc < nArcs; ++iArc) {
    rArc = disappearing[iArc];
    lArc = disappearing[iArc - 1];
    setEdgeEnd(rArc.edge, lArc.site, rArc.site, vertex);
  }

  lArc = disappearing[0];
  rArc = disappearing[nArcs - 1];
  rArc.edge = createEdge(lArc.site, rArc.site, null, vertex);

  attachCircle(lArc);
  attachCircle(rArc);
}

function addBeach(site) {
  var x = site[0],
      directrix = site[1],
      lArc,
      rArc,
      dxl,
      dxr,
      node = beaches._;

  while (node) {
    dxl = leftBreakPoint(node, directrix) - x;
    if (dxl > epsilon$1) node = node.L; else {
      dxr = x - rightBreakPoint(node, directrix);
      if (dxr > epsilon$1) {
        if (!node.R) {
          lArc = node;
          break;
        }
        node = node.R;
      } else {
        if (dxl > -epsilon$1) {
          lArc = node.P;
          rArc = node;
        } else if (dxr > -epsilon$1) {
          lArc = node;
          rArc = node.N;
        } else {
          lArc = rArc = node;
        }
        break;
      }
    }
  }

  createCell(site);
  var newArc = createBeach(site);
  beaches.insert(lArc, newArc);

  if (!lArc && !rArc) return;

  if (lArc === rArc) {
    detachCircle(lArc);
    rArc = createBeach(lArc.site);
    beaches.insert(newArc, rArc);
    newArc.edge = rArc.edge = createEdge(lArc.site, newArc.site);
    attachCircle(lArc);
    attachCircle(rArc);
    return;
  }

  if (!rArc) { // && lArc
    newArc.edge = createEdge(lArc.site, newArc.site);
    return;
  }

  // else lArc !== rArc
  detachCircle(lArc);
  detachCircle(rArc);

  var lSite = lArc.site,
      ax = lSite[0],
      ay = lSite[1],
      bx = site[0] - ax,
      by = site[1] - ay,
      rSite = rArc.site,
      cx = rSite[0] - ax,
      cy = rSite[1] - ay,
      d = 2 * (bx * cy - by * cx),
      hb = bx * bx + by * by,
      hc = cx * cx + cy * cy,
      vertex = [(cy * hb - by * hc) / d + ax, (bx * hc - cx * hb) / d + ay];

  setEdgeEnd(rArc.edge, lSite, rSite, vertex);
  newArc.edge = createEdge(lSite, site, null, vertex);
  rArc.edge = createEdge(site, rSite, null, vertex);
  attachCircle(lArc);
  attachCircle(rArc);
}

function leftBreakPoint(arc, directrix) {
  var site = arc.site,
      rfocx = site[0],
      rfocy = site[1],
      pby2 = rfocy - directrix;

  if (!pby2) return rfocx;

  var lArc = arc.P;
  if (!lArc) return -Infinity;

  site = lArc.site;
  var lfocx = site[0],
      lfocy = site[1],
      plby2 = lfocy - directrix;

  if (!plby2) return lfocx;

  var hl = lfocx - rfocx,
      aby2 = 1 / pby2 - 1 / plby2,
      b = hl / plby2;

  if (aby2) return (-b + Math.sqrt(b * b - 2 * aby2 * (hl * hl / (-2 * plby2) - lfocy + plby2 / 2 + rfocy - pby2 / 2))) / aby2 + rfocx;

  return (rfocx + lfocx) / 2;
}

function rightBreakPoint(arc, directrix) {
  var rArc = arc.N;
  if (rArc) return leftBreakPoint(rArc, directrix);
  var site = arc.site;
  return site[1] === directrix ? site[0] : Infinity;
}

var epsilon$1 = 1e-6;
var epsilon2$2 = 1e-12;
var beaches;
var cells;
var circles;
var edges;

function triangleArea(a, b, c) {
  return (a[0] - c[0]) * (b[1] - a[1]) - (a[0] - b[0]) * (c[1] - a[1]);
}

function lexicographic(a, b) {
  return b[1] - a[1]
      || b[0] - a[0];
}

function Diagram(sites, extent) {
  var site = sites.sort(lexicographic).pop(),
      x,
      y,
      circle;

  edges = [];
  cells = new Array(sites.length);
  beaches = new RedBlackTree;
  circles = new RedBlackTree;

  while (true) {
    circle = firstCircle;
    if (site && (!circle || site[1] < circle.y || (site[1] === circle.y && site[0] < circle.x))) {
      if (site[0] !== x || site[1] !== y) {
        addBeach(site);
        x = site[0], y = site[1];
      }
      site = sites.pop();
    } else if (circle) {
      removeBeach(circle.arc);
    } else {
      break;
    }
  }

  sortCellHalfedges();

  if (extent) {
    var x0 = +extent[0][0],
        y0 = +extent[0][1],
        x1 = +extent[1][0],
        y1 = +extent[1][1];
    clipEdges(x0, y0, x1, y1);
    clipCells(x0, y0, x1, y1);
  }

  this.edges = edges;
  this.cells = cells;

  beaches =
  circles =
  edges =
  cells = null;
}

Diagram.prototype = {
  constructor: Diagram,

  polygons: function() {
    var edges = this.edges;

    return this.cells.map(function(cell) {
      var polygon = cell.halfedges.map(function(i) { return cellHalfedgeStart(cell, edges[i]); });
      polygon.data = cell.site.data;
      return polygon;
    });
  },

  triangles: function() {
    var triangles = [],
        edges = this.edges;

    this.cells.forEach(function(cell, i) {
      var site = cell.site,
          halfedges = cell.halfedges,
          j = -1,
          m = halfedges.length,
          s0,
          e1 = edges[halfedges[m - 1]],
          s1 = e1.left === site ? e1.right : e1.left;

      while (++j < m) {
        s0 = s1;
        e1 = edges[halfedges[j]];
        s1 = e1.left === site ? e1.right : e1.left;
        if (i < s0.index && i < s1.index && triangleArea(site, s0, s1) < 0) {
          triangles.push([site.data, s0.data, s1.data]);
        }
      }
    });

    return triangles;
  },

  links: function() {
    return this.edges.filter(function(edge) {
      return edge.right;
    }).map(function(edge) {
      return {
        source: edge.left.data,
        target: edge.right.data
      };
    });
  }
}

function voronoi() {
  var x = x$2,
      y = y$2,
      extent = null;

  function voronoi(data) {
    return new Diagram(data.map(function(d, i) {
      var s = [Math.round(x(d, i, data) / epsilon$1) * epsilon$1, Math.round(y(d, i, data) / epsilon$1) * epsilon$1];
      s.index = i;
      s.data = d;
      return s;
    }), extent);
  }

  voronoi.polygons = function(data) {
    return voronoi(data).polygons();
  };

  voronoi.links = function(data) {
    return voronoi(data).links();
  };

  voronoi.triangles = function(data) {
    return voronoi(data).triangles();
  };

  voronoi.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$7(+_), voronoi) : x;
  };

  voronoi.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$7(+_), voronoi) : y;
  };

  voronoi.extent = function(_) {
    return arguments.length ? (extent = _ == null ? null : [[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]], voronoi) : extent && [[extent[0][0], extent[0][1]], [extent[1][0], extent[1][1]]];
  };

  voronoi.size = function(_) {
    return arguments.length ? (extent = _ == null ? null : [[0, 0], [+_[0], +_[1]]], voronoi) : extent && [extent[1][0] - extent[0][0], extent[1][1] - extent[0][1]];
  };

  return voronoi;
}

function Voronoi(params) {
  Transform.call(this, null, params);
}

var prototype$50 = inherits(Voronoi, Transform);

var defaultExtent = [[-1e5, -1e5], [1e5, 1e5]];

prototype$50.transform = function(_, pulse) {
  var as = _.as || 'path',
      data = pulse.source,
      diagram, polygons, i, n;

  // configure and construct voronoi diagram
  diagram = voronoi().x(_.x).y(_.y);
  if (_.size) diagram.size(_.size);
  else diagram.extent(_.extent || defaultExtent);

  this.value = (diagram = diagram(data));

  // map polygons to paths
  polygons = diagram.polygons();
  for (i=0, n=data.length; i<n; ++i) {
    data[i][as] = polygons[i]
      ? 'M' + polygons[i].join('L') + 'Z'
      : null;
  }

  return pulse.reflow().modifies(as);
};

var VoronoiDefinition = {
  "type": "Voronoi",
  "metadata": {"modifies": true},
  "params": [
    { "name": "x", "type": "field", "required": true },
    { "name": "y", "type": "field", "required": true },
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "extent", "type": "array", "array": true, "length": 2,
      "default": [[-1e5, -1e5], [1e5, 1e5]],
      "content": {"type": "number", "array": true, "length": 2} },
    { "name": "as", "type": "string", "default": "path" }
  ]
};

register(VoronoiDefinition, Voronoi);

var cloudRadians = Math.PI / 180;
var cw = 1 << 11 >> 5;
var ch = 1 << 11;
function cloud() {
  var size = [256, 256],
      text,
      font,
      fontSize,
      fontStyle,
      fontWeight,
      rotate,
      padding,
      spiral = archimedeanSpiral,
      words = [],
      random = Math.random,
      cloud = {},
      canvas = cloudCanvas;

  cloud.layout = function() {
    var contextAndRatio = getContext(canvas()),
        board = zeroArray((size[0] >> 5) * size[1]),
        bounds = null,
        n = words.length,
        i = -1,
        tags = [],
        data = words.map(function(d) {
          return {
            text: text(d),
            font: font(d),
            style: fontStyle(d),
            weight: fontWeight(d),
            rotate: rotate(d),
            size: ~~fontSize(d),
            padding: padding(d),
            xoff: 0,
            yoff: 0,
            x1: 0,
            y1: 0,
            x0: 0,
            y0: 0,
            hasText: false,
            sprite: null,
            datum: d
          };
        }).sort(function(a, b) { return b.size - a.size; });

    while (++i < n) {
      var d = data[i];
      d.x = (size[0] * (random() + .5)) >> 1;
      d.y = (size[1] * (random() + .5)) >> 1;
      cloudSprite(contextAndRatio, d, data, i);
      if (d.hasText && place(board, d, bounds)) {
        tags.push(d);
        if (bounds) cloudBounds(bounds, d);
        else bounds = [{x: d.x + d.x0, y: d.y + d.y0}, {x: d.x + d.x1, y: d.y + d.y1}];
        // Temporary hack
        d.x -= size[0] >> 1;
        d.y -= size[1] >> 1;
      }
    }

    return tags;
  }

  function getContext(canvas) {
    canvas.width = canvas.height = 1;
    var ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);
    canvas.width = (cw << 5) / ratio;
    canvas.height = ch / ratio;

    var context = canvas.getContext("2d");
    context.fillStyle = context.strokeStyle = "red";
    context.textAlign = "center";

    return {context: context, ratio: ratio};
  }

  function place(board, tag, bounds) {
    var startX = tag.x,
        startY = tag.y,
        maxDelta = Math.sqrt(size[0] * size[0] + size[1] * size[1]),
        s = spiral(size),
        dt = random() < .5 ? 1 : -1,
        t = -dt,
        dxdy,
        dx,
        dy;

    while (dxdy = s(t += dt)) {
      dx = ~~dxdy[0];
      dy = ~~dxdy[1];

      if (Math.min(Math.abs(dx), Math.abs(dy)) >= maxDelta) break;

      tag.x = startX + dx;
      tag.y = startY + dy;

      if (tag.x + tag.x0 < 0 || tag.y + tag.y0 < 0 ||
          tag.x + tag.x1 > size[0] || tag.y + tag.y1 > size[1]) continue;
      // TODO only check for collisions within current bounds.
      if (!bounds || !cloudCollide(tag, board, size[0])) {
        if (!bounds || collideRects(tag, bounds)) {
          var sprite = tag.sprite,
              w = tag.width >> 5,
              sw = size[0] >> 5,
              lx = tag.x - (w << 4),
              sx = lx & 0x7f,
              msx = 32 - sx,
              h = tag.y1 - tag.y0,
              x = (tag.y + tag.y0) * sw + (lx >> 5),
              last;
          for (var j = 0; j < h; j++) {
            last = 0;
            for (var i = 0; i <= w; i++) {
              board[x + i] |= (last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0);
            }
            x += sw;
          }
          tag.sprite = null;
          return true;
        }
      }
    }
    return false;
  }

  cloud.words = function(_) {
    return arguments.length ? (words = _, cloud) : words;
  };

  cloud.size = function(_) {
    return arguments.length ? (size = [+_[0], +_[1]], cloud) : size;
  };

  cloud.font = function(_) {
    return arguments.length ? (font = functor(_), cloud) : font;
  };

  cloud.fontStyle = function(_) {
    return arguments.length ? (fontStyle = functor(_), cloud) : fontStyle;
  };

  cloud.fontWeight = function(_) {
    return arguments.length ? (fontWeight = functor(_), cloud) : fontWeight;
  };

  cloud.rotate = function(_) {
    return arguments.length ? (rotate = functor(_), cloud) : rotate;
  };

  cloud.text = function(_) {
    return arguments.length ? (text = functor(_), cloud) : text;
  };

  cloud.spiral = function(_) {
    return arguments.length ? (spiral = spirals[_] || _, cloud) : spiral;
  };

  cloud.fontSize = function(_) {
    return arguments.length ? (fontSize = functor(_), cloud) : fontSize;
  };

  cloud.padding = function(_) {
    return arguments.length ? (padding = functor(_), cloud) : padding;
  };

  cloud.random = function(_) {
    return arguments.length ? (random = _, cloud) : random;
  };

  return cloud;
}

// Fetches a monochrome sprite bitmap for the specified text.
// Load in batches for speed.
function cloudSprite(contextAndRatio, d, data, di) {
  if (d.sprite) return;
  var c = contextAndRatio.context,
      ratio = contextAndRatio.ratio;

  c.clearRect(0, 0, (cw << 5) / ratio, ch / ratio);
  var x = 0,
      y = 0,
      maxh = 0,
      n = data.length,
      w, w32, h, i, j;
  --di;
  while (++di < n) {
    d = data[di];
    c.save();
    c.font = d.style + " " + d.weight + " " + ~~((d.size + 1) / ratio) + "px " + d.font;
    w = c.measureText(d.text + "m").width * ratio;
    h = d.size << 1;
    if (d.rotate) {
      var sr = Math.sin(d.rotate * cloudRadians),
          cr = Math.cos(d.rotate * cloudRadians),
          wcr = w * cr,
          wsr = w * sr,
          hcr = h * cr,
          hsr = h * sr;
      w = (Math.max(Math.abs(wcr + hsr), Math.abs(wcr - hsr)) + 0x1f) >> 5 << 5;
      h = ~~Math.max(Math.abs(wsr + hcr), Math.abs(wsr - hcr));
    } else {
      w = (w + 0x1f) >> 5 << 5;
    }
    if (h > maxh) maxh = h;
    if (x + w >= (cw << 5)) {
      x = 0;
      y += maxh;
      maxh = 0;
    }
    if (y + h >= ch) break;
    c.translate((x + (w >> 1)) / ratio, (y + (h >> 1)) / ratio);
    if (d.rotate) c.rotate(d.rotate * cloudRadians);
    c.fillText(d.text, 0, 0);
    if (d.padding) c.lineWidth = 2 * d.padding, c.strokeText(d.text, 0, 0);
    c.restore();
    d.width = w;
    d.height = h;
    d.xoff = x;
    d.yoff = y;
    d.x1 = w >> 1;
    d.y1 = h >> 1;
    d.x0 = -d.x1;
    d.y0 = -d.y1;
    d.hasText = true;
    x += w;
  }
  var pixels = c.getImageData(0, 0, (cw << 5) / ratio, ch / ratio).data,
      sprite = [];
  while (--di >= 0) {
    d = data[di];
    if (!d.hasText) continue;
    w = d.width;
    w32 = w >> 5;
    h = d.y1 - d.y0;
    // Zero the buffer
    for (i = 0; i < h * w32; i++) sprite[i] = 0;
    x = d.xoff;
    if (x == null) return;
    y = d.yoff;
    var seen = 0,
        seenRow = -1;
    for (j = 0; j < h; j++) {
      for (i = 0; i < w; i++) {
        var k = w32 * j + (i >> 5),
            m = pixels[((y + j) * (cw << 5) + (x + i)) << 2] ? 1 << (31 - (i % 32)) : 0;
        sprite[k] |= m;
        seen |= m;
      }
      if (seen) seenRow = j;
      else {
        d.y0++;
        h--;
        j--;
        y++;
      }
    }
    d.y1 = d.y0 + seenRow;
    d.sprite = sprite.slice(0, (d.y1 - d.y0) * w32);
  }
}

// Use mask-based collision detection.
function cloudCollide(tag, board, sw) {
  sw >>= 5;
  var sprite = tag.sprite,
      w = tag.width >> 5,
      lx = tag.x - (w << 4),
      sx = lx & 0x7f,
      msx = 32 - sx,
      h = tag.y1 - tag.y0,
      x = (tag.y + tag.y0) * sw + (lx >> 5),
      last;
  for (var j = 0; j < h; j++) {
    last = 0;
    for (var i = 0; i <= w; i++) {
      if (((last << msx) | (i < w ? (last = sprite[j * w + i]) >>> sx : 0))
          & board[x + i]) return true;
    }
    x += sw;
  }
  return false;
}

function cloudBounds(bounds, d) {
  var b0 = bounds[0],
      b1 = bounds[1];
  if (d.x + d.x0 < b0.x) b0.x = d.x + d.x0;
  if (d.y + d.y0 < b0.y) b0.y = d.y + d.y0;
  if (d.x + d.x1 > b1.x) b1.x = d.x + d.x1;
  if (d.y + d.y1 > b1.y) b1.y = d.y + d.y1;
}

function collideRects(a, b) {
  return a.x + a.x1 > b[0].x && a.x + a.x0 < b[1].x && a.y + a.y1 > b[0].y && a.y + a.y0 < b[1].y;
}

function archimedeanSpiral(size) {
  var e = size[0] / size[1];
  return function(t) {
    return [e * (t *= .1) * Math.cos(t), t * Math.sin(t)];
  };
}

function rectangularSpiral(size) {
  var dy = 4,
      dx = dy * size[0] / size[1],
      x = 0,
      y = 0;
  return function(t) {
    var sign = t < 0 ? -1 : 1;
    // See triangular numbers: T_n = n * (n + 1) / 2.
    switch ((Math.sqrt(1 + 4 * sign * t) - sign) & 3) {
      case 0:  x += dx; break;
      case 1:  y += dy; break;
      case 2:  x -= dx; break;
      default: y -= dy; break;
    }
    return [x, y];
  };
}

// TODO reuse arrays?
function zeroArray(n) {
  var a = [],
      i = -1;
  while (++i < n) a[i] = 0;
  return a;
}

function cloudCanvas() {
  try {
    return typeof document !== 'undefined' && document.createElement
      ? document.createElement('canvas')
      : new (require('canvas'))();
  } catch (e) {
    error('Canvas unavailable. Run in browser or install node-canvas.');
  }
}

function functor(d) {
  return typeof d === "function" ? d : function() { return d; };
}

var spirals = {
  archimedean: archimedeanSpiral,
  rectangular: rectangularSpiral
};

var output = ['x', 'y', 'font', 'fontSize', 'fontStyle', 'fontWeight', 'angle'];

function Wordcloud(params) {
  Transform.call(this, cloud(), params);
}

var prototype$51 = inherits(Wordcloud, Transform);

prototype$51.transform = function(_, pulse) {
  var run = _.modified()
        || pulse.changed(pulse.ADD_REM)
        || isFunction(_.text) && pulse.modified(_.text.fields)
        || isFunction(_.font) && pulse.modified(_.font.fields)
        || isFunction(_.rotate) && pulse.modified(_.rotate.fields)
        || isFunction(_.fontSize) && pulse.modified(_.fontSize.fields)
        || isFunction(_.fontStyle) && pulse.modified(_.fontStyle.fields)
        || isFunction(_.fontWeight) && pulse.modified(_.fontWeight.fields);
  if (!run) return;

  var layout = this.value,
      as = _.as || output,
      fontSize = _.fontSize || 14,
      range, fsize, sizeScale, words;

  isFunction(fontSize)
    ? (range = _.fontSizeRange)
    : (fontSize = constant$1(fontSize));

  // create font size scaling function as needed
  if (range) {
    fsize = fontSize;
    sizeScale = scale('sqrt')().domain(extent$2(fsize, pulse)).range(range);
    fontSize = function(x) { return sizeScale(fsize(x)); };
  }

  var data = pulse.materialize(pulse.SOURCE).source;
  data.forEach(function(t) {
    t[as[0]] = NaN;
    t[as[1]] = NaN;
    t[as[3]] = 0;
  });

  // configure layout
  words = layout
    .words(data)
    .text(_.text)
    .size(_.size || [500, 500])
    .padding(_.padding || 1)
    .spiral(_.spiral || 'archimedean')
    .rotate(_.rotate || 0)
    .font(_.font || 'sans-serif')
    .fontStyle(_.fontStyle || 'normal')
    .fontWeight(_.fontWeight || 'normal')
    .fontSize(fontSize)
    .layout();

  var size = layout.size(),
      dx = size[0] >> 1,
      dy = size[1] >> 1,
      i = 0,
      n = words.length,
      w, t;

  for (; i<n; ++i) {
    w = words[i];
    t = w.datum;
    t[as[0]] = w.x + dx;
    t[as[1]] = w.y + dy;
    t[as[2]] = w.font;
    t[as[3]] = w.size;
    t[as[4]] = w.style;
    t[as[5]] = w.weight;
    t[as[6]] = w.rotate;
  }

  return pulse.reflow().modifies(as);
};

function extent$2(size, pulse) {
  var e = new transforms.Extent();
  e.transform({field: size, modified: truthy}, pulse);
  return e.value;
}

var WordcloudDefinition = {
  "type": "Wordcloud",
  "metadata": {"modifies": true},
  "params": [
    { "name": "size", "type": "number", "array": true, "length": 2 },
    { "name": "font", "type": "string", "expr": true, "default": "sans-serif" },
    { "name": "fontStyle", "type": "string", "expr": true, "default": "normal" },
    { "name": "fontWeight", "type": "string", "expr": true, "default": "normal" },
    { "name": "fontSize", "type": "number", "expr": true, "default": 14 },
    { "name": "fontSizeRange", "type": "number", "array": true, "null": true, "default": [10, 50] },
    { "name": "rotate", "type": "number", "expr": true, "default": 0 },
    { "name": "text", "type": "field" },
    { "name": "spiral", "type": "string", "values": ["archimedean", "rectangular"] },
    { "name": "padding", "type": "number", "expr": true },
    { "name": "as", "type": "string", "array": true, "length": 7,
      "default": ["x", "y", "font", "fontSize", "fontStyle", "fontWeight", "angle"] }
  ]
};

register(WordcloudDefinition, Wordcloud);

function array8(n) { return new Uint8Array(n); }

function array16(n) { return new Uint16Array(n); }

function array32(n) { return new Uint32Array(n); }

/**
 * Maintains CrossFilter state.
 */
function Bitmaps() {

  var width = 8,
      data = [],
      seen = array32(0),
      curr = array$4(0, width),
      prev = array$4(0, width);

  return {

    data: function() { return data; },

    seen: function() {
      return (seen = lengthen(seen, data.length));
    },

    add: function(array) {
      for (var i=0, j=data.length, n=array.length, t; i<n; ++i) {
        t = array[i];
        t._index = j++;
        data.push(t);
      }
    },

    remove: function(num, map) { // map: index -> boolean (true => remove)
      var n = data.length,
          copy = Array(n - num),
          reindex = data, // reuse old data array for index map
          t, i, j;

      // seek forward to first removal
      for (i=0; !map[i] && i<n; ++i) {
        copy[i] = data[i];
        reindex[i] = i;
      }

      // condense arrays
      for (j=i; i<n; ++i) {
        t = data[i];
        if (!map[i]) {
          reindex[i] = j;
          curr[j] = curr[i];
          prev[j] = prev[i];
          copy[j] = t;
          t._index = j++;
        } else {
          reindex[i] = -1;
        }
        curr[i] = 0; // clear unused bits
      }

      return (data = copy, reindex);
    },

    size: function() { return data.length; },

    curr: function() { return curr; },

    prev: function() { return prev; },

    reset: function(k) { prev[k] = curr[k]; },

    all: function() {
      return width < 0x101 ? 0xff : width < 0x10001 ? 0xffff : 0xffffffff;
    },

    set: function(k, one) { curr[k] |= one; },

    clear: function(k, one) { curr[k] &= ~one; },

    resize: function(n, m) {
      var k = curr.length;
      if (n > k || m > width) {
        width = Math.max(m, width);
        curr = array$4(n, width, curr);
        prev = array$4(n, width);
      }
    }
  };
}

function lengthen(array, length, copy) {
  if (array.length >= length) return array;
  copy = copy || new array.constructor(length);
  copy.set(array);
  return copy;
}

function array$4(n, m, array) {
  var copy = (m < 0x101 ? array8 : m < 0x10001 ? array16 : array32)(n);
  if (array) copy.set(array);
  return copy;
}

function Dimension(index, i, query) {
  var bit = (1 << i);

  return {
    one:     bit,
    zero:    ~bit,
    range:   query.slice(),
    bisect:  index.bisect,
    index:   index.index,
    size:    index.size,

    onAdd: function(added, curr) {
      var dim = this,
          range = dim.bisect(dim.range, added.value),
          idx = added.index,
          lo = range[0],
          hi = range[1],
          n1 = idx.length, i;

      for (i=0;  i<lo; ++i) curr[idx[i]] |= bit;
      for (i=hi; i<n1; ++i) curr[idx[i]] |= bit;
      return dim;
    }
  };
}

/**
 * Maintains a list of values, sorted by key.
 */
function SortedIndex() {
  var index = array32(0),
      value = [],
      size = 0;

  function insert(key, data, base) {
    if (!data.length) return [];

    var n0 = size,
        n1 = data.length,
        addv = Array(n1),
        addi = array32(n1),
        oldv, oldi, i;

    for (i=0; i<n1; ++i) {
      addv[i] = key(data[i]);
      addi[i] = i;
    }
    addv = sort(addv, addi);

    if (n0) {
      oldv = value;
      oldi = index;
      value = Array(n0 + n1);
      index = array32(n0 + n1);
      merge$3(base, oldv, oldi, n0, addv, addi, n1, value, index);
    } else {
      if (base > 0) for (i=0; i<n1; ++i) {
        addi[i] += base;
      }
      value = addv;
      index = addi;
    }
    size = n0 + n1;

    return {index: addi, value: addv};
  }

  function remove(num, map) {
    // map: index -> remove
    var n = size,
        idx, i, j;

    // seek forward to first removal
    for (i=0; !map[index[i]] && i<n; ++i);

    // condense index and value arrays
    for (j=i; i<n; ++i) {
      if (!map[idx=index[i]]) {
        index[j] = idx;
        value[j] = value[i];
        ++j;
      }
    }

    size = n - num;
  }

  function reindex(map) {
    for (var i=0, n=size; i<n; ++i) {
      index[i] = map[index[i]];
    }
  }

  function bisect(range, array) {
    var n = array ? array.length : (array = value, size);
    return [
      bisectLeft(array, range[0], 0, n),
      bisectRight(array, range[1], 0, n)
    ];
  }

  return {
    insert:  insert,
    remove:  remove,
    bisect:  bisect,
    reindex: reindex,
    index:   function() { return index; },
    size:    function() { return size; }
  };
}

function sort(values, index) {
  values.sort.call(index, function(a, b) {
    var x = values[a],
        y = values[b];
    return x < y ? -1 : x > y ? 1 : 0;
  });
  return permute(values, index);
}

function merge$3(base, value0, index0, n0, value1, index1, n1, value, index) {
  var i0 = 0, i1 = 0, i;

  for (i=0; i0 < n0 && i1 < n1; ++i) {
    if (value0[i0] < value1[i1]) {
      value[i] = value0[i0];
      index[i] = index0[i0++];
    } else {
      value[i] = value1[i1];
      index[i] = index1[i1++] + base;
    }
  }

  for (; i0 < n0; ++i0, ++i) {
    value[i] = value0[i0];
    index[i] = index0[i0];
  }

  for (; i1 < n1; ++i1, ++i) {
    value[i] = value1[i1];
    index[i] = index1[i1] + base;
  }
}

/**
 * An indexed multi-dimensional filter.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {Array<function(object): *>} params.fields - An array of dimension accessors to filter.
 * @param {Array} params.query - An array of per-dimension range queries.
 */
function CrossFilter(params) {
  Transform.call(this, Bitmaps(), params);
  this._indices = null;
  this._dims = null;
}

var prototype$52 = inherits(CrossFilter, Transform);

prototype$52.transform = function(_, pulse) {
  if (!this._dims) {
    return this.init(_, pulse);
  } else {
    var init = _.modified('fields')
          || _.fields.some(function(f) { return pulse.modified(f.fields); });

    return init
      ? this.reinit(_, pulse)
      : this.eval(_, pulse);
  }
};

prototype$52.init = function(_, pulse) {
  var fields = _.fields,
      query = _.query,
      indices = this._indices = {},
      dims = this._dims = [],
      m = query.length,
      i = 0, key, index;

  // instantiate indices and dimensions
  for (; i<m; ++i) {
    key = fields[i].fname;
    index = indices[key] || (indices[key] = SortedIndex());
    dims.push(Dimension(index, i, query[i]));
  }

  return this.eval(_, pulse);
};

prototype$52.reinit = function(_, pulse) {
  var output = pulse.materialize().fork(),
      fields = _.fields,
      query = _.query,
      indices = this._indices,
      dims = this._dims,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all = bits.all(),
      out = (output.rem = output.add),
      mod = output.mod,
      m = query.length,
      adds = {}, add, index, key,
      mods, remMap, modMap, i, n, f;

  // set prev to current state
  prev.set(curr);

  // if pulse has remove tuples, process them first
  if (pulse.rem.length) {
    remMap = this.remove(_, pulse, output);
  }

  // if pulse has added tuples, add them to state
  if (pulse.add.length) {
    bits.add(pulse.add);
  }

  // if pulse has modified tuples, create an index map
  if (pulse.mod.length) {
    modMap = {};
    for (mods=pulse.mod, i=0, n=mods.length; i<n; ++i) {
      modMap[mods[i]._index] = 1;
    }
  }

  // re-initialize indices as needed, update curr bitmap
  for (i=0; i<m; ++i) {
    f = fields[i];
    if (!dims[i] || _.modified('fields', i) || pulse.modified(f.fields)) {
      key = f.fname;
      if (!(add = adds[key])) {
        indices[key] = index = SortedIndex();
        adds[key] = add = index.insert(f, pulse.source, 0);
      }
      dims[i] = Dimension(index, i, query[i]).onAdd(add, curr);
    }
  }

  // visit each tuple
  // if filter state changed, push index to add/rem
  // else if in mod and passes a filter, push index to mod
  for (i=0, n=bits.data().length; i<n; ++i) {
    if (remMap[i]) { // skip if removed tuple
      continue;
    } else if (prev[i] !== curr[i]) { // add if state changed
      out.push(i);
    } else if (modMap[i] && curr[i] !== all) { // otherwise, pass mods through
      mod.push(i);
    }
  }

  bits.mask = (1 << m) - 1;
  return output;
};

prototype$52.eval = function(_, pulse) {
  var output = pulse.materialize().fork(),
      m = this._dims.length,
      mask = 0;

  if (pulse.rem.length) {
    this.remove(_, pulse, output);
    mask |= (1 << m) - 1;
  }

  if (_.modified('query') && !_.modified('fields')) {
    mask |= this.update(_, pulse, output);
  }

  if (pulse.add.length) {
    this.insert(_, pulse, output);
    mask |= (1 << m) - 1;
  }

  if (pulse.mod.length) {
    this.modify(pulse, output);
    mask |= (1 << m) - 1;
  }

  this.value.mask = mask;
  return output;
};

prototype$52.insert = function(_, pulse, output) {
  var tuples = pulse.add,
      bits = this.value,
      dims = this._dims,
      indices = this._indices,
      fields = _.fields,
      adds = {},
      out = output.add,
      k = bits.size(),
      n = k + tuples.length,
      m = dims.length, j, key, add;

  // resize bitmaps and add tuples as needed
  bits.resize(n, m);
  bits.add(tuples);

  var curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all();

  // add to dimensional indices
  for (j=0; j<m; ++j) {
    key = fields[j].fname;
    add = adds[key] || (adds[key] = indices[key].insert(fields[j], tuples, k));
    dims[j].onAdd(add, curr);
  }

  // set previous filters, output if passes at least one filter
  for (; k<n; ++k) {
    prev[k] = all;
    if (curr[k] !== all) out.push(k);
  }
};

prototype$52.modify = function(pulse, output) {
  var out = output.mod,
      bits = this.value,
      curr = bits.curr(),
      all  = bits.all(),
      tuples = pulse.mod,
      i, n, k;

  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    if (curr[k] !== all) out.push(k);
  }
};

prototype$52.remove = function(_, pulse, output) {
  var indices = this._indices,
      bits = this.value,
      curr = bits.curr(),
      prev = bits.prev(),
      all  = bits.all(),
      map = {},
      out = output.rem,
      tuples = pulse.rem,
      i, n, k, f;

  // process tuples, output if passes at least one filter
  for (i=0, n=tuples.length; i<n; ++i) {
    k = tuples[i]._index;
    map[k] = 1; // build index map
    prev[k] = (f = curr[k]);
    curr[k] = all;
    if (f !== all) out.push(k);
  }

  // remove from dimensional indices
  for (k in indices) {
    indices[k].remove(n, map);
  }

  return (this.reindex(pulse, n, map), map);
};

// reindex filters and indices after propagation completes
prototype$52.reindex = function(pulse, num, map) {
  var indices = this._indices,
      bits = this.value;

  pulse.runAfter(function() {
    var indexMap = bits.remove(num, map);
    for (var key in indices) indices[key].reindex(indexMap);
  });
};

prototype$52.update = function(_, pulse, output) {
  var dims = this._dims,
      query = _.query,
      stamp = pulse.stamp,
      m = dims.length,
      mask = 0, i, q;

  // survey how many queries have changed
  output.filters = 0;
  for (q=0; q<m; ++q) {
    if (_.modified('query', q)) { i = q; ++mask; }
  }

  if (mask === 1) {
    // only one query changed, use more efficient update
    mask = dims[i].one;
    this.incrementOne(dims[i], query[i], output.add, output.rem);
  } else {
    // multiple queries changed, perform full record keeping
    for (q=0, mask=0; q<m; ++q) {
      if (!_.modified('query', q)) continue;
      mask |= dims[q].one;
      this.incrementAll(dims[q], query[q], stamp, output.add);
      output.rem = output.add; // duplicate add/rem for downstream resolve
    }
  }

  return mask;
};

prototype$52.incrementAll = function(dim, query, stamp, out) {
  var bits = this.value,
      seen = bits.seen(),
      curr = bits.curr(),
      prev = bits.prev(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one = dim.one,
      i, j, k;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one;
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one;
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one;
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      if (seen[k] !== stamp) {
        prev[k] = curr[k];
        seen[k] = stamp;
        out.push(k);
      }
      curr[k] ^= one;
    }
  }

  dim.range = query.slice();
};

prototype$52.incrementOne = function(dim, query, add, rem) {
  var bits = this.value,
      curr = bits.curr(),
      index = dim.index(),
      old = dim.bisect(dim.range),
      range = dim.bisect(query),
      lo1 = range[0],
      hi1 = range[1],
      lo0 = old[0],
      hi0 = old[1],
      one = dim.one,
      i, j, k;

  // Fast incremental update based on previous lo index.
  if (lo1 < lo0) {
    for (i = lo1, j = Math.min(lo0, hi1); i < j; ++i) {
      k = index[i];
      curr[k] ^= one;
      add.push(k);
    }
  } else if (lo1 > lo0) {
    for (i = lo0, j = Math.min(lo1, hi0); i < j; ++i) {
      k = index[i];
      curr[k] ^= one;
      rem.push(k);
    }
  }

  // Fast incremental update based on previous hi index.
  if (hi1 > hi0) {
    for (i = Math.max(lo1, hi0), j = hi1; i < j; ++i) {
      k = index[i];
      curr[k] ^= one;
      add.push(k);
    }
  } else if (hi1 < hi0) {
    for (i = Math.max(lo0, hi1), j = hi0; i < j; ++i) {
      k = index[i];
      curr[k] ^= one;
      rem.push(k);
    }
  }

  dim.range = query.slice();
};

var CrossFilterDefinition = {
  "type": "CrossFilter",
  "metadata": {},
  "params": [
    { "name": "fields", "type": "field", "array": true, "required": true },
    { "name": "query", "type": "array", "array": true, "required": true,
      "content": {"type": "number", "array": true, "length": 2} }
  ]
};

/**
 * Selectively filters tuples by resolving against a filter bitmap.
 * Useful for processing the output of a cross-filter transform.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.ignore - A bit mask indicating which filters to ignore.
 * @param {object} params.filter - The per-tuple filter bitmaps. Typically this
 *   parameter value is a reference to a {@link CrossFilter} transform.
 */
function ResolveFilter(params) {
  Transform.call(this, null, params);
}

var prototype$53 = inherits(ResolveFilter, Transform);

prototype$53.transform = function(_, pulse) {
  var ignore = ~(_.ignore || 0), // bit mask where zeros -> dims to ignore
      bitmap = _.filter,
      mask = bitmap.mask;

  // exit early if no relevant filter changes
  if ((mask & ignore) === 0) return pulse.StopPropagation;

  var output = pulse.fork(pulse.ALL),
      data = bitmap.data(),
      curr = bitmap.curr(),
      prev = bitmap.prev(),
      pass = function(k) {
        return !(curr[k] & ignore) ? data[k] : null;
      };

  // propagate all mod tuples that pass the filter
  output.filter(output.MOD, pass);

  // determine add & rem tuples via filter functions
  // for efficiency, we do *not* populate new arrays,
  // instead we add filter functions applied downstream

  if (!(mask & (mask-1))) { // only one filter changed
    output.filter(output.ADD, pass);
    output.filter(output.REM, function(k) {
      return (curr[k] & ignore) === mask ? data[k] : null;
    });

  } else { // multiple filters changed
    output.filter(output.ADD, function(k) {
      var c = curr[k] & ignore,
          f = !c && (c ^ (prev[k] & ignore));
      return f ? data[k] : null;
    });
    output.filter(output.REM, function(k) {
      var c = curr[k] & ignore,
          f = c && !(c ^ (c ^ (prev[k] & ignore)));
      return f ? data[k] : null;
    });
  }

  // add filter to source data in case of reflow...
  return output.filter(output.SOURCE, function(t) { return pass(t._index); });
};

var ResolveFilterDefinition = {
  "type": "ResolveFilter",
  "metadata": {},
  "params": [
    { "name": "ignore", "type": "number", "required": true,
      "description": "A bit mask indicating which filters to ignore." },
    { "name": "filter", "type": "object", "required": true,
      "description": "Per-tuple filter bitmaps from a CrossFilter transform." }
  ]
};

register(CrossFilterDefinition, CrossFilter);

register(ResolveFilterDefinition, ResolveFilter);

function Bounds(b) {
  this.clear();
  if (b) this.union(b);
}

var prototype$55 = Bounds.prototype;

prototype$55.clone = function() {
  return new Bounds(this);
};

prototype$55.clear = function() {
  this.x1 = +Number.MAX_VALUE;
  this.y1 = +Number.MAX_VALUE;
  this.x2 = -Number.MAX_VALUE;
  this.y2 = -Number.MAX_VALUE;
  return this;
};

prototype$55.set = function(x1, y1, x2, y2) {
  if (x2 < x1) {
    this.x2 = x1;
    this.x1 = x2;
  } else {
    this.x1 = x1;
    this.x2 = x2;
  }
  if (y2 < y1) {
    this.y2 = y1;
    this.y1 = y2;
  } else {
    this.y1 = y1;
    this.y2 = y2;
  }
  return this;
};

prototype$55.add = function(x, y) {
  if (x < this.x1) this.x1 = x;
  if (y < this.y1) this.y1 = y;
  if (x > this.x2) this.x2 = x;
  if (y > this.y2) this.y2 = y;
  return this;
};

prototype$55.expand = function(d) {
  this.x1 -= d;
  this.y1 -= d;
  this.x2 += d;
  this.y2 += d;
  return this;
};

prototype$55.round = function() {
  this.x1 = Math.floor(this.x1);
  this.y1 = Math.floor(this.y1);
  this.x2 = Math.ceil(this.x2);
  this.y2 = Math.ceil(this.y2);
  return this;
};

prototype$55.translate = function(dx, dy) {
  this.x1 += dx;
  this.x2 += dx;
  this.y1 += dy;
  this.y2 += dy;
  return this;
};

prototype$55.rotate = function(angle, x, y) {
  var cos = Math.cos(angle),
      sin = Math.sin(angle),
      cx = x - x*cos + y*sin,
      cy = y - x*sin - y*cos,
      x1 = this.x1, x2 = this.x2,
      y1 = this.y1, y2 = this.y2;

  return this.clear()
    .add(cos*x1 - sin*y1 + cx,  sin*x1 + cos*y1 + cy)
    .add(cos*x1 - sin*y2 + cx,  sin*x1 + cos*y2 + cy)
    .add(cos*x2 - sin*y1 + cx,  sin*x2 + cos*y1 + cy)
    .add(cos*x2 - sin*y2 + cx,  sin*x2 + cos*y2 + cy);
};

prototype$55.union = function(b) {
  if (b.x1 < this.x1) this.x1 = b.x1;
  if (b.y1 < this.y1) this.y1 = b.y1;
  if (b.x2 > this.x2) this.x2 = b.x2;
  if (b.y2 > this.y2) this.y2 = b.y2;
  return this;
};

prototype$55.encloses = function(b) {
  return b && (
    this.x1 <= b.x1 &&
    this.x2 >= b.x2 &&
    this.y1 <= b.y1 &&
    this.y2 >= b.y2
  );
};

prototype$55.alignsWith = function(b) {
  return b && (
    this.x1 == b.x1 ||
    this.x2 == b.x2 ||
    this.y1 == b.y1 ||
    this.y2 == b.y2
  );
};

prototype$55.intersects = function(b) {
  return b && !(
    this.x2 < b.x1 ||
    this.x1 > b.x2 ||
    this.y2 < b.y1 ||
    this.y1 > b.y2
  );
};

prototype$55.contains = function(x, y) {
  return !(
    x < this.x1 ||
    x > this.x2 ||
    y < this.y1 ||
    y > this.y2
  );
};

prototype$55.width = function() {
  return this.x2 - this.x1;
};

prototype$55.height = function() {
  return this.y2 - this.y1;
};

var gradient_id = 0;

function Gradient(p0, p1) {
  var stops = [], gradient;
  return gradient = {
    id: 'gradient_' + (gradient_id++),
    x1: p0 ? p0[0] : 0,
    y1: p0 ? p0[1] : 0,
    x2: p1 ? p1[0] : 1,
    y2: p1 ? p1[1] : 0,
    stops: stops,
    stop: function(offset, color) {
      stops.push({offset: offset, color: color});
      return gradient;
    }
  };
}

function Item(mark) {
  this.mark = mark;
  this.bounds = (this.bounds || new Bounds());
  this.bounds_prev = (this.bounds_prev || new Bounds());
}

function inherits$1(child, parent) {
  var proto = (child.prototype = Object.create(parent.prototype));
  proto.constructor = child;
  return proto;
}

function GroupItem(mark) {
  Item.call(this, mark);
  this.items = (this.items || []);
}

inherits$1(GroupItem, Item);

var Canvas;

try { Canvas = require('canvas'); } catch (e) { Canvas = null; }

function Canvas$1(w, h) {
  var canvas = null;
  if (typeof document !== 'undefined' && document.createElement) {
    canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
  } else if (Canvas) {
    canvas = new Canvas(w, h);
  }
  return canvas;
}

var Image$1 = typeof Image !== 'undefined' ? Image
  : (Canvas && Canvas.Image || null);

function ImageLoader(imageLoader) {
  this._pending = 0;
  this._loader = imageLoader || loader();
}

var prototype$56 = ImageLoader.prototype;

prototype$56.pending = function() {
  return this._pending;
};

prototype$56.loadImage = function(uri) {
  var loader = this;
  loader._pending += 1;

  return loader._loader.sanitize(uri, {context:'image'})
    .then(function(url) {
      if (!url || !Image$1) throw 'Image unsupported.';

      var image = new Image$1();

      image.onload = function() {
        loader._pending -= 1;
        image.loaded = true;
      };

      image.onerror = function() {
        loader._pending -= 1;
        image.loaded = false;
      }

      image.src = url;
      return image;
    })
    .catch(function() {
      loader._pending -= 1;
      return {loaded: false, width: 0, height: 0};
    });
};

prototype$56.ready = function() {
  var loader = this;
  return new Promise(function(accept) {
    function poll(value) {
      if (!loader._pending) accept(value);
      else setTimeout(function() { poll(true); }, 10);
    }
    poll(false);
  });
};

function Scenegraph() {
  this.root = createMark({
    marktype: 'group',
    name: 'root',
    role: 'frame'
  });
  this.root.items = [new GroupItem(this.root)];
}

var prototype$57 = Scenegraph.prototype;

prototype$57.mark = function(scenepath, markdef) {
  var markpath = scenepath.marks,
      itempath = scenepath.items,
      item = this.root.items[0],
      mark, index, i, n;

  try {
    for (i=0, n=markpath.length; i<n; ++i) {
      mark = item.items[markpath[i]];
      if (!mark) break;
      index = itempath[i] || 0;
      item = mark.items[index] || mark.items[mark.items.length-1];
    }

    if (!mark) {
      mark = createMark(markdef, item);
      item.items[markpath[i]] = mark;
      if (mark.zindex) mark.group.zdirty = true;
      return mark;
    }

    throw n;
  } catch (err) {
    error$1('Invalid scenegraph path: ' + JSON.stringify(scenepath));
  }
};

function error$1(msg) {
  throw Error(msg);
}

function createMark(def, group) {
  return {
    bounds:      new Bounds(),
    bounds_prev: new Bounds(),
    clip:        !!def.clip,
    group:       group,
    interactive: def.interactive === false ? false : true,
    items:       [],
    marktype:    def.marktype,
    name:        def.name || undefined,
    role:        def.role || undefined,
    zindex:      def.zindex || 0
  };
}

function Handler() {
  this._active = null;
  this._handlers = {};
}

var prototype$58 = Handler.prototype;

prototype$58.initialize = function(el, origin, obj) {
  this._el = el;
  this._obj = obj || null;
  return this.origin(origin);
};

prototype$58.element = function() {
  return this._el;
};

prototype$58.origin = function(origin) {
  this._origin = origin || [0, 0];
  return this;
};

prototype$58.scene = function(scene) {
  if (!arguments.length) return this._scene;
  this._scene = scene;
  return this;
};

// add an event handler
// subclasses should override
prototype$58.on = function(/*type, handler*/) {};

// remove an event handler
// subclasses should override
prototype$58.off = function(/*type, handler*/) {};

// return an array with all registered event handlers
prototype$58.handlers = function() {
  var h = this._handlers, a = [], k;
  for (k in h) { a.push.apply(a, h[k]); }
  return a;
};

prototype$58.eventName = function(name) {
  var i = name.indexOf('.');
  return i < 0 ? name : name.slice(0,i);
};

/**
 * Create a new Renderer instance.
 * @param {object} [imageLoader] - Optional loader instance for
 *   image URL sanitization. If not specified, a standard loader
 *   instance will be generated.
 * @constructor
 */
function Renderer(imageLoader) {
  this._el = null;
  this._bgcolor = null;
  this._loader = new ImageLoader(imageLoader);
}

var prototype$59 = Renderer.prototype;

/**
 * Initialize a new Renderer instance.
 * @param {DOMElement} el - The containing DOM element for the display.
 * @param {number} width - The width of the display, in pixels.
 * @param {number} height - The height of the display, in pixels.
 * @param {Array<number>} origin - The origin of the display, in pixels.
 *   The coordinate system will be translated to this point.
 * @return {Renderer} - This renderer instance;
 */
prototype$59.initialize = function(el, width, height, origin) {
  this._el = el;
  return this.resize(width, height, origin);
};

/**
 * Returns the parent container element for a visualization.
 * @return {DOMElement} - The containing DOM element.
 */
prototype$59.element = function() {
  return this._el;
};

/**
 * Returns the scene element (e.g., canvas or SVG) of the visualization
 * Subclasses must override if the first child is not the scene element.
 * @return {DOMElement} - The scene (e.g., canvas or SVG) element.
 */
prototype$59.scene = function() {
  return this._el && this._el.firstChild;
};

/**
 * Get / set the background color.
 */
prototype$59.background = function(bgcolor) {
  if (arguments.length === 0) return this._bgcolor;
  this._bgcolor = bgcolor;
  return this;
};

/**
 * Resize the display.
 * @param {number} width - The new width of the display, in pixels.
 * @param {number} height - The new height of the display, in pixels.
 * @param {Array<number>} origin - The new origin of the display, in pixels.
 *   The coordinate system will be translated to this point.
 * @return {Renderer} - This renderer instance;
 */
prototype$59.resize = function(width, height, origin) {
  this._width = width;
  this._height = height;
  this._origin = origin || [0, 0];
  return this;
};

/**
 * Render an input scenegraph, potentially with a set of dirty items.
 * This method will perform an immediate rendering with available resources.
 * The renderer may also need to perform image loading to perform a complete
 * render. This process can lead to asynchronous re-rendering of the scene
 * after this method returns. To receive notification when rendering is
 * complete, use the renderAsync method instead.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 * @return {Renderer} - This renderer instance.
 */
prototype$59.render = function(scene, items) {
  var r = this;

  // bind arguments into a render call, and cache it
  // this function may be subsequently called for async redraw
  r._call = function() { r._render(scene, items); };

  // invoke the renderer
  r._call();

  // clear the cached call for garbage collection
  // async redraws will stash their own copy
  r._call = null;

  return r;
};

/**
 * Internal rendering method. Renderer subclasses should override this
 * method to actually perform rendering.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 */
prototype$59._render = function(/*scene, items*/) {
  // subclasses to override
};

/**
 * Asynchronous rendering method. Similar to render, but returns a Promise
 * that resolves when all rendering is completed. Sometimes a renderer must
 * perform image loading to get a complete rendering. The returned
 * Promise will not resolve until this process completes.
 * @param {object} scene - The root mark of a scenegraph to render.
 * @param {Array<object>} [items] - An optional array of dirty items.
 *   If provided, the renderer may optimize the redraw of these items.
 * @return {Promise} - A Promise that resolves when rendering is complete.
 */
prototype$59.renderAsync = function(scene, items) {
  var r = this.render(scene, items);
  return this._ready
    ? this._ready.then(function() { return r; })
    : Promise.resolve(r);
};

/**
 * Requests an image to include in the rendered scene.
 * This method proxies a call to ImageLoader.loadImage, but also tracks
 * image loading progress and invokes a re-render once complete.
 * @return {Image} - The requested image instance.
 *   The image content may not be loaded yet.
 */
prototype$59.loadImage = function(uri) {
  var r = this,
      p = r._loader.loadImage(uri);

  if (!r._ready) {
    // re-render the scene when image loading completes
    var call = r._call;
    r._ready = r._loader.ready()
      .then(function(redraw) {
        if (redraw) call();
        r._ready = null;
      });
  }

  return p;
};

var pi$1 = Math.PI;
var tau$1 = 2 * pi$1;
var epsilon$2 = 1e-6;
var tauEpsilon = tau$1 - epsilon$2;
function Path() {
  this._x0 = this._y0 = // start of current subpath
  this._x1 = this._y1 = null; // end of current subpath
  this._ = [];
}

function path() {
  return new Path;
}

Path.prototype = path.prototype = {
  constructor: Path,
  moveTo: function(x, y) {
    this._.push("M", this._x0 = this._x1 = +x, ",", this._y0 = this._y1 = +y);
  },
  closePath: function() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._.push("Z");
    }
  },
  lineTo: function(x, y) {
    this._.push("L", this._x1 = +x, ",", this._y1 = +y);
  },
  quadraticCurveTo: function(x1, y1, x, y) {
    this._.push("Q", +x1, ",", +y1, ",", this._x1 = +x, ",", this._y1 = +y);
  },
  bezierCurveTo: function(x1, y1, x2, y2, x, y) {
    this._.push("C", +x1, ",", +y1, ",", +x2, ",", +y2, ",", this._x1 = +x, ",", this._y1 = +y);
  },
  arcTo: function(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;
    var x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._.push(
        "M", this._x1 = x1, ",", this._y1 = y1
      );
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon$2)) {}

    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
    // Equivalently, is (x1,y1) coincident with (x2,y2)?
    // Or, is the radius zero? Line to (x1,y1).
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon$2) || !r) {
      this._.push(
        "L", this._x1 = x1, ",", this._y1 = y1
      );
    }

    // Otherwise, draw an arc!
    else {
      var x20 = x2 - x0,
          y20 = y2 - y0,
          l21_2 = x21 * x21 + y21 * y21,
          l20_2 = x20 * x20 + y20 * y20,
          l21 = Math.sqrt(l21_2),
          l01 = Math.sqrt(l01_2),
          l = r * Math.tan((pi$1 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

      // If the start tangent is not coincident with (x0,y0), line to.
      if (Math.abs(t01 - 1) > epsilon$2) {
        this._.push(
          "L", x1 + t01 * x01, ",", y1 + t01 * y01
        );
      }

      this._.push(
        "A", r, ",", r, ",0,0,", +(y01 * x20 > x01 * y20), ",", this._x1 = x1 + t21 * x21, ",", this._y1 = y1 + t21 * y21
      );
    }
  },
  arc: function(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r;
    var dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is the radius negative? Error.
    if (r < 0) throw new Error("negative radius: " + r);

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._.push(
        "M", x0, ",", y0
      );
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon$2 || Math.abs(this._y1 - y0) > epsilon$2) {
      this._.push(
        "L", x0, ",", y0
      );
    }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._.push(
        "A", r, ",", r, ",0,1,", cw, ",", x - dx, ",", y - dy,
        "A", r, ",", r, ",0,1,", cw, ",", this._x1 = x0, ",", this._y1 = y0
      );
    }

    // Otherwise, draw an arc!
    else {
      if (da < 0) da = da % tau$1 + tau$1;
      this._.push(
        "A", r, ",", r, ",0,", +(da >= pi$1), ",", cw, ",", this._x1 = x + r * Math.cos(a1), ",", this._y1 = y + r * Math.sin(a1)
      );
    }
  },
  rect: function(x, y, w, h) {
    this._.push("M", this._x0 = this._x1 = +x, ",", this._y0 = this._y1 = +y, "h", +w, "v", +h, "h", -w, "Z");
  },
  toString: function() {
    return this._.join("");
  }
};

function constant$8(x) {
  return function constant() {
    return x;
  };
}

var epsilon$3 = 1e-12;
var pi$2 = Math.PI;
var halfPi$1 = pi$2 / 2;
var tau$2 = 2 * pi$2;

function arcInnerRadius(d) {
  return d.innerRadius;
}

function arcOuterRadius(d) {
  return d.outerRadius;
}

function arcStartAngle(d) {
  return d.startAngle;
}

function arcEndAngle(d) {
  return d.endAngle;
}

function arcPadAngle(d) {
  return d && d.padAngle; // Note: optional!
}

function asin$1(x) {
  return x >= 1 ? halfPi$1 : x <= -1 ? -halfPi$1 : Math.asin(x);
}

function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0, y10 = y1 - y0,
      x32 = x3 - x2, y32 = y3 - y2,
      t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / (y32 * x10 - x32 * y10);
  return [x0 + t * x10, y0 + t * y10];
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / Math.sqrt(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x11 = x0 + ox,
      y11 = y0 + oy,
      x10 = x1 + ox,
      y10 = y1 + oy,
      x00 = (x11 + x10) / 2,
      y00 = (y11 + y10) / 2,
      dx = x10 - x11,
      dy = y10 - y11,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x11 * y10 - x10 * y11,
      d = (dy < 0 ? -1 : 1) * Math.sqrt(Math.max(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x00,
      dy0 = cy0 - y00,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}

function d3_arc() {
  var innerRadius = arcInnerRadius,
      outerRadius = arcOuterRadius,
      cornerRadius = constant$8(0),
      padRadius = null,
      startAngle = arcStartAngle,
      endAngle = arcEndAngle,
      padAngle = arcPadAngle,
      context = null;

  function arc() {
    var buffer,
        r,
        r0 = +innerRadius.apply(this, arguments),
        r1 = +outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) - halfPi$1,
        a1 = endAngle.apply(this, arguments) - halfPi$1,
        da = Math.abs(a1 - a0),
        cw = a1 > a0;

    if (!context) context = buffer = path();

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) r = r1, r1 = r0, r0 = r;

    // Is it a point?
    if (!(r1 > epsilon$3)) context.moveTo(0, 0);

    // Or is it a circle or annulus?
    else if (da > tau$2 - epsilon$3) {
      context.moveTo(r1 * Math.cos(a0), r1 * Math.sin(a0));
      context.arc(0, 0, r1, a0, a1, !cw);
      if (r0 > epsilon$3) {
        context.moveTo(r0 * Math.cos(a1), r0 * Math.sin(a1));
        context.arc(0, 0, r0, a1, a0, cw);
      }
    }

    // Or is it a circular or annular sector?
    else {
      var a01 = a0,
          a11 = a1,
          a00 = a0,
          a10 = a1,
          da0 = da,
          da1 = da,
          ap = padAngle.apply(this, arguments) / 2,
          rp = (ap > epsilon$3) && (padRadius ? +padRadius.apply(this, arguments) : Math.sqrt(r0 * r0 + r1 * r1)),
          rc = Math.min(Math.abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
          rc0 = rc,
          rc1 = rc,
          t0,
          t1;

      // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
      if (rp > epsilon$3) {
        var p0 = asin$1(rp / r0 * Math.sin(ap)),
            p1 = asin$1(rp / r1 * Math.sin(ap));
        if ((da0 -= p0 * 2) > epsilon$3) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
        else da0 = 0, a00 = a10 = (a0 + a1) / 2;
        if ((da1 -= p1 * 2) > epsilon$3) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
        else da1 = 0, a01 = a11 = (a0 + a1) / 2;
      }

      var x01 = r1 * Math.cos(a01),
          y01 = r1 * Math.sin(a01),
          x10 = r0 * Math.cos(a10),
          y10 = r0 * Math.sin(a10);

      // Apply rounded corners?
      if (rc > epsilon$3) {
        var x11 = r1 * Math.cos(a11),
            y11 = r1 * Math.sin(a11),
            x00 = r0 * Math.cos(a00),
            y00 = r0 * Math.sin(a00);

        // Restrict the corner radius according to the sector angle.
        if (da < pi$2) {
          var oc = da0 > epsilon$3 ? intersect(x01, y01, x00, y00, x11, y11, x10, y10) : [x10, y10],
              ax = x01 - oc[0],
              ay = y01 - oc[1],
              bx = x11 - oc[0],
              by = y11 - oc[1],
              kc = 1 / Math.sin(Math.acos((ax * bx + ay * by) / (Math.sqrt(ax * ax + ay * ay) * Math.sqrt(bx * bx + by * by))) / 2),
              lc = Math.sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
          rc0 = Math.min(rc, (r0 - lc) / (kc - 1));
          rc1 = Math.min(rc, (r1 - lc) / (kc + 1));
        }
      }

      // Is the sector collapsed to a line?
      if (!(da1 > epsilon$3)) context.moveTo(x01, y01);

      // Does the sector’s outer ring have rounded corners?
      else if (rc1 > epsilon$3) {
        t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
        t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

        context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, Math.atan2(t0.y01, t0.x01), Math.atan2(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc1, Math.atan2(t0.y01, t0.x01), Math.atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r1, Math.atan2(t0.cy + t0.y11, t0.cx + t0.x11), Math.atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
          context.arc(t1.cx, t1.cy, rc1, Math.atan2(t1.y11, t1.x11), Math.atan2(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the outer ring just a circular arc?
      else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

      // Is there no inner ring, and it’s a circular sector?
      // Or perhaps it’s an annular sector collapsed due to padding?
      if (!(r0 > epsilon$3) || !(da0 > epsilon$3)) context.lineTo(x10, y10);

      // Does the sector’s inner ring (or point) have rounded corners?
      else if (rc0 > epsilon$3) {
        t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
        t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

        context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, Math.atan2(t0.y01, t0.x01), Math.atan2(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc0, Math.atan2(t0.y01, t0.x01), Math.atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r0, Math.atan2(t0.cy + t0.y11, t0.cx + t0.x11), Math.atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
          context.arc(t1.cx, t1.cy, rc0, Math.atan2(t1.y11, t1.x11), Math.atan2(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the inner ring just a circular arc?
      else context.arc(0, 0, r0, a10, a00, cw);
    }

    context.closePath();

    if (buffer) return context = null, buffer + "" || null;
  }

  arc.centroid = function() {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi$2 / 2;
    return [Math.cos(a) * r, Math.sin(a) * r];
  };

  arc.innerRadius = function(_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$8(+_), arc) : innerRadius;
  };

  arc.outerRadius = function(_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$8(+_), arc) : outerRadius;
  };

  arc.cornerRadius = function(_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$8(+_), arc) : cornerRadius;
  };

  arc.padRadius = function(_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$8(+_), arc) : padRadius;
  };

  arc.startAngle = function(_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$8(+_), arc) : startAngle;
  };

  arc.endAngle = function(_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$8(+_), arc) : endAngle;
  };

  arc.padAngle = function(_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$8(+_), arc) : padAngle;
  };

  arc.context = function(_) {
    return arguments.length ? ((context = _ == null ? null : _), arc) : context;
  };

  return arc;
}

function Linear(context) {
  this._context = context;
}

Linear.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; // proceed
      default: this._context.lineTo(x, y); break;
    }
  }
};

function curveLinear(context) {
  return new Linear(context);
}

function x$4(p) {
  return p[0];
}

function y$4(p) {
  return p[1];
}

function line$2() {
  var x = x$4,
      y = y$4,
      defined = constant$8(true),
      context = null,
      curve = curveLinear,
      output = null;

  function line(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) output.lineStart();
        else output.lineEnd();
      }
      if (defined0) output.point(+x(d, i, data), +y(d, i, data));
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  line.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant$8(+_), line) : x;
  };

  line.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant$8(+_), line) : y;
  };

  line.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$8(!!_), line) : defined;
  };

  line.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), line) : curve;
  };

  line.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), line) : context;
  };

  return line;
}

function area$2() {
  var x0 = x$4,
      x1 = null,
      y0 = constant$8(0),
      y1 = y$4,
      defined = constant$8(true),
      context = null,
      curve = curveLinear,
      output = null;

  function area(data) {
    var i,
        j,
        k,
        n = data.length,
        d,
        defined0 = false,
        buffer,
        x0z = new Array(n),
        y0z = new Array(n);

    if (context == null) output = curve(buffer = path());

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) {
          j = i;
          output.areaStart();
          output.lineStart();
        } else {
          output.lineEnd();
          output.lineStart();
          for (k = i - 1; k >= j; --k) {
            output.point(x0z[k], y0z[k]);
          }
          output.lineEnd();
          output.areaEnd();
        }
      }
      if (defined0) {
        x0z[i] = +x0(d, i, data), y0z[i] = +y0(d, i, data);
        output.point(x1 ? +x1(d, i, data) : x0z[i], y1 ? +y1(d, i, data) : y0z[i]);
      }
    }

    if (buffer) return output = null, buffer + "" || null;
  }

  function arealine() {
    return line$2().defined(defined).curve(curve).context(context);
  }

  area.x = function(_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$8(+_), x1 = null, area) : x0;
  };

  area.x0 = function(_) {
    return arguments.length ? (x0 = typeof _ === "function" ? _ : constant$8(+_), area) : x0;
  };

  area.x1 = function(_) {
    return arguments.length ? (x1 = _ == null ? null : typeof _ === "function" ? _ : constant$8(+_), area) : x1;
  };

  area.y = function(_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$8(+_), y1 = null, area) : y0;
  };

  area.y0 = function(_) {
    return arguments.length ? (y0 = typeof _ === "function" ? _ : constant$8(+_), area) : y0;
  };

  area.y1 = function(_) {
    return arguments.length ? (y1 = _ == null ? null : typeof _ === "function" ? _ : constant$8(+_), area) : y1;
  };

  area.lineX0 =
  area.lineY0 = function() {
    return arealine().x(x0).y(y0);
  };

  area.lineY1 = function() {
    return arealine().x(x0).y(y1);
  };

  area.lineX1 = function() {
    return arealine().x(x1).y(y0);
  };

  area.defined = function(_) {
    return arguments.length ? (defined = typeof _ === "function" ? _ : constant$8(!!_), area) : defined;
  };

  area.curve = function(_) {
    return arguments.length ? (curve = _, context != null && (output = curve(context)), area) : curve;
  };

  area.context = function(_) {
    return arguments.length ? (_ == null ? context = output = null : output = curve(context = _), area) : context;
  };

  return area;
}

var circle$2 = {
  draw: function(context, size) {
    var r = Math.sqrt(size / pi$2);
    context.moveTo(r, 0);
    context.arc(0, 0, r, 0, tau$2);
  }
};

var kr = Math.sin(pi$2 / 10) / Math.sin(7 * pi$2 / 10);
var kx = Math.sin(tau$2 / 10) * kr;
var ky = -Math.cos(tau$2 / 10) * kr;

function d3_symbol() {
  var type = constant$8(circle$2),
      size = constant$8(64),
      context = null;

  function symbol() {
    var buffer;
    if (!context) context = buffer = path();
    type.apply(this, arguments).draw(context, +size.apply(this, arguments));
    if (buffer) return context = null, buffer + "" || null;
  }

  symbol.type = function(_) {
    return arguments.length ? (type = typeof _ === "function" ? _ : constant$8(_), symbol) : type;
  };

  symbol.size = function(_) {
    return arguments.length ? (size = typeof _ === "function" ? _ : constant$8(+_), symbol) : size;
  };

  symbol.context = function(_) {
    return arguments.length ? (context = _ == null ? null : _, symbol) : context;
  };

  return symbol;
}

function noop$3() {}

function point$2(that, x, y) {
  that._context.bezierCurveTo(
    (2 * that._x0 + that._x1) / 3,
    (2 * that._y0 + that._y1) / 3,
    (that._x0 + 2 * that._x1) / 3,
    (that._y0 + 2 * that._y1) / 3,
    (that._x0 + 4 * that._x1 + x) / 6,
    (that._y0 + 4 * that._y1 + y) / 6
  );
}

function Basis(context) {
  this._context = context;
}

Basis.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 3: point$2(this, this._x1, this._y1); // proceed
      case 2: this._context.lineTo(this._x1, this._y1); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._context.lineTo((5 * this._x0 + this._x1) / 6, (5 * this._y0 + this._y1) / 6); // proceed
      default: point$2(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
  }
};

function curveBasis(context) {
  return new Basis(context);
}

function Bundle(context, beta) {
  this._basis = new Basis(context);
  this._beta = beta;
}

Bundle.prototype = {
  lineStart: function() {
    this._x = [];
    this._y = [];
    this._basis.lineStart();
  },
  lineEnd: function() {
    var x = this._x,
        y = this._y,
        j = x.length - 1;

    if (j > 0) {
      var x0 = x[0],
          y0 = y[0],
          dx = x[j] - x0,
          dy = y[j] - y0,
          i = -1,
          t;

      while (++i <= j) {
        t = i / j;
        this._basis.point(
          this._beta * x[i] + (1 - this._beta) * (x0 + t * dx),
          this._beta * y[i] + (1 - this._beta) * (y0 + t * dy)
        );
      }
    }

    this._x = this._y = null;
    this._basis.lineEnd();
  },
  point: function(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

var curveBundle = (function custom(beta) {

  function bundle(context) {
    return beta === 1 ? new Basis(context) : new Bundle(context, beta);
  }

  bundle.beta = function(beta) {
    return custom(+beta);
  };

  return bundle;
})(0.85);

function point$3(that, x, y) {
  that._context.bezierCurveTo(
    that._x1 + that._k * (that._x2 - that._x0),
    that._y1 + that._k * (that._y2 - that._y0),
    that._x2 + that._k * (that._x1 - x),
    that._y2 + that._k * (that._y1 - y),
    that._x2,
    that._y2
  );
}

function Cardinal(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

Cardinal.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x2, this._y2); break;
      case 3: point$3(this, this._x1, this._y1); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; this._x1 = x, this._y1 = y; break;
      case 2: this._point = 3; // proceed
      default: point$3(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCardinal = (function custom(tension) {

  function cardinal(context) {
    return new Cardinal(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalClosed(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalClosed.prototype = {
  areaStart: noop$3,
  areaEnd: noop$3,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 =
    this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._x3 = x, this._y3 = y; break;
      case 1: this._point = 2; this._context.moveTo(this._x4 = x, this._y4 = y); break;
      case 2: this._point = 3; this._x5 = x, this._y5 = y; break;
      default: point$3(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

(function custom(tension) {

  function cardinal(context) {
    return new CardinalClosed(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function CardinalOpen(context, tension) {
  this._context = context;
  this._k = (1 - tension) / 6;
}

CardinalOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2); break;
      case 3: this._point = 4; // proceed
      default: point$3(this, x, y); break;
    }
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

(function custom(tension) {

  function cardinal(context) {
    return new CardinalOpen(context, tension);
  }

  cardinal.tension = function(tension) {
    return custom(+tension);
  };

  return cardinal;
})(0);

function point$4(that, x, y) {
  var x1 = that._x1,
      y1 = that._y1,
      x2 = that._x2,
      y2 = that._y2;

  if (that._l01_a > epsilon$3) {
    var a = 2 * that._l01_2a + 3 * that._l01_a * that._l12_a + that._l12_2a,
        n = 3 * that._l01_a * (that._l01_a + that._l12_a);
    x1 = (x1 * a - that._x0 * that._l12_2a + that._x2 * that._l01_2a) / n;
    y1 = (y1 * a - that._y0 * that._l12_2a + that._y2 * that._l01_2a) / n;
  }

  if (that._l23_a > epsilon$3) {
    var b = 2 * that._l23_2a + 3 * that._l23_a * that._l12_a + that._l12_2a,
        m = 3 * that._l23_a * (that._l23_a + that._l12_a);
    x2 = (x2 * b + that._x1 * that._l23_2a - x * that._l12_2a) / m;
    y2 = (y2 * b + that._y1 * that._l23_2a - y * that._l12_2a) / m;
  }

  that._context.bezierCurveTo(x1, y1, x2, y2, that._x2, that._y2);
}

function CatmullRom(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRom.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x2, this._y2); break;
      case 3: this.point(this._x2, this._y2); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; // proceed
      default: point$4(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

var curveCatmullRom = (function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRom(context, alpha) : new Cardinal(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomClosed(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomClosed.prototype = {
  areaStart: noop$3,
  areaEnd: noop$3,
  lineStart: function() {
    this._x0 = this._x1 = this._x2 = this._x3 = this._x4 = this._x5 =
    this._y0 = this._y1 = this._y2 = this._y3 = this._y4 = this._y5 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 1: {
        this._context.moveTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 2: {
        this._context.lineTo(this._x3, this._y3);
        this._context.closePath();
        break;
      }
      case 3: {
        this.point(this._x3, this._y3);
        this.point(this._x4, this._y4);
        this.point(this._x5, this._y5);
        break;
      }
    }
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; this._x3 = x, this._y3 = y; break;
      case 1: this._point = 2; this._context.moveTo(this._x4 = x, this._y4 = y); break;
      case 2: this._point = 3; this._x5 = x, this._y5 = y; break;
      default: point$4(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

(function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomClosed(context, alpha) : new CardinalClosed(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function CatmullRomOpen(context, alpha) {
  this._context = context;
  this._alpha = alpha;
}

CatmullRomOpen.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 = this._x2 =
    this._y0 = this._y1 = this._y2 = NaN;
    this._l01_a = this._l12_a = this._l23_a =
    this._l01_2a = this._l12_2a = this._l23_2a =
    this._point = 0;
  },
  lineEnd: function() {
    if (this._line || (this._line !== 0 && this._point === 3)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;

    if (this._point) {
      var x23 = this._x2 - x,
          y23 = this._y2 - y;
      this._l23_a = Math.sqrt(this._l23_2a = Math.pow(x23 * x23 + y23 * y23, this._alpha));
    }

    switch (this._point) {
      case 0: this._point = 1; break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; this._line ? this._context.lineTo(this._x2, this._y2) : this._context.moveTo(this._x2, this._y2); break;
      case 3: this._point = 4; // proceed
      default: point$4(this, x, y); break;
    }

    this._l01_a = this._l12_a, this._l12_a = this._l23_a;
    this._l01_2a = this._l12_2a, this._l12_2a = this._l23_2a;
    this._x0 = this._x1, this._x1 = this._x2, this._x2 = x;
    this._y0 = this._y1, this._y1 = this._y2, this._y2 = y;
  }
};

(function custom(alpha) {

  function catmullRom(context) {
    return alpha ? new CatmullRomOpen(context, alpha) : new CardinalOpen(context, 0);
  }

  catmullRom.alpha = function(alpha) {
    return custom(+alpha);
  };

  return catmullRom;
})(0.5);

function sign$1(x) {
  return x < 0 ? -1 : 1;
}

// Calculate the slopes of the tangents (Hermite-type interpolation) based on
// the following paper: Steffen, M. 1990. A Simple Method for Monotonic
// Interpolation in One Dimension. Astronomy and Astrophysics, Vol. 239, NO.
// NOV(II), P. 443, 1990.
function slope3(that, x2, y2) {
  var h0 = that._x1 - that._x0,
      h1 = x2 - that._x1,
      s0 = (that._y1 - that._y0) / (h0 || h1 < 0 && -0),
      s1 = (y2 - that._y1) / (h1 || h0 < 0 && -0),
      p = (s0 * h1 + s1 * h0) / (h0 + h1);
  return (sign$1(s0) + sign$1(s1)) * Math.min(Math.abs(s0), Math.abs(s1), 0.5 * Math.abs(p)) || 0;
}

// Calculate a one-sided slope.
function slope2(that, t) {
  var h = that._x1 - that._x0;
  return h ? (3 * (that._y1 - that._y0) / h - t) / 2 : t;
}

// According to https://en.wikipedia.org/wiki/Cubic_Hermite_spline#Representations
// "you can express cubic Hermite interpolation in terms of cubic Bézier curves
// with respect to the four values p0, p0 + m0 / 3, p1 - m1 / 3, p1".
function point$5(that, t0, t1) {
  var x0 = that._x0,
      y0 = that._y0,
      x1 = that._x1,
      y1 = that._y1,
      dx = (x1 - x0) / 3;
  that._context.bezierCurveTo(x0 + dx, y0 + dx * t0, x1 - dx, y1 - dx * t1, x1, y1);
}

function MonotoneX(context) {
  this._context = context;
}

MonotoneX.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x0 = this._x1 =
    this._y0 = this._y1 =
    this._t0 = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    switch (this._point) {
      case 2: this._context.lineTo(this._x1, this._y1); break;
      case 3: point$5(this, this._t0, slope2(this, this._t0)); break;
    }
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    this._line = 1 - this._line;
  },
  point: function(x, y) {
    var t1 = NaN;

    x = +x, y = +y;
    if (x === this._x1 && y === this._y1) return; // Ignore coincident points.
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; break;
      case 2: this._point = 3; point$5(this, slope2(this, t1 = slope3(this, x, y)), t1); break;
      default: point$5(this, this._t0, t1 = slope3(this, x, y)); break;
    }

    this._x0 = this._x1, this._x1 = x;
    this._y0 = this._y1, this._y1 = y;
    this._t0 = t1;
  }
}

function MonotoneY(context) {
  this._context = new ReflectContext(context);
}

(MonotoneY.prototype = Object.create(MonotoneX.prototype)).point = function(x, y) {
  MonotoneX.prototype.point.call(this, y, x);
};

function ReflectContext(context) {
  this._context = context;
}

ReflectContext.prototype = {
  moveTo: function(x, y) { this._context.moveTo(y, x); },
  closePath: function() { this._context.closePath(); },
  lineTo: function(x, y) { this._context.lineTo(y, x); },
  bezierCurveTo: function(x1, y1, x2, y2, x, y) { this._context.bezierCurveTo(y1, x1, y2, x2, y, x); }
};

function monotoneX(context) {
  return new MonotoneX(context);
}

function monotoneY(context) {
  return new MonotoneY(context);
}

function Natural(context) {
  this._context = context;
}

Natural.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = [];
    this._y = [];
  },
  lineEnd: function() {
    var x = this._x,
        y = this._y,
        n = x.length;

    if (n) {
      this._line ? this._context.lineTo(x[0], y[0]) : this._context.moveTo(x[0], y[0]);
      if (n === 2) {
        this._context.lineTo(x[1], y[1]);
      } else {
        var px = controlPoints(x),
            py = controlPoints(y);
        for (var i0 = 0, i1 = 1; i1 < n; ++i0, ++i1) {
          this._context.bezierCurveTo(px[0][i0], py[0][i0], px[1][i0], py[1][i0], x[i1], y[i1]);
        }
      }
    }

    if (this._line || (this._line !== 0 && n === 1)) this._context.closePath();
    this._line = 1 - this._line;
    this._x = this._y = null;
  },
  point: function(x, y) {
    this._x.push(+x);
    this._y.push(+y);
  }
};

// See https://www.particleincell.com/2012/bezier-splines/ for derivation.
function controlPoints(x) {
  var i,
      n = x.length - 1,
      m,
      a = new Array(n),
      b = new Array(n),
      r = new Array(n);
  a[0] = 0, b[0] = 2, r[0] = x[0] + 2 * x[1];
  for (i = 1; i < n - 1; ++i) a[i] = 1, b[i] = 4, r[i] = 4 * x[i] + 2 * x[i + 1];
  a[n - 1] = 2, b[n - 1] = 7, r[n - 1] = 8 * x[n - 1] + x[n];
  for (i = 1; i < n; ++i) m = a[i] / b[i - 1], b[i] -= m, r[i] -= m * r[i - 1];
  a[n - 1] = r[n - 1] / b[n - 1];
  for (i = n - 2; i >= 0; --i) a[i] = (r[i] - a[i + 1]) / b[i];
  b[n - 1] = (x[n] + a[n - 1]) / 2;
  for (i = 0; i < n - 1; ++i) b[i] = 2 * x[i + 1] - a[i + 1];
  return [a, b];
}

function curveNatural(context) {
  return new Natural(context);
}

function Step(context, t) {
  this._context = context;
  this._t = t;
}

Step.prototype = {
  areaStart: function() {
    this._line = 0;
  },
  areaEnd: function() {
    this._line = NaN;
  },
  lineStart: function() {
    this._x = this._y = NaN;
    this._point = 0;
  },
  lineEnd: function() {
    if (0 < this._t && this._t < 1 && this._point === 2) this._context.lineTo(this._x, this._y);
    if (this._line || (this._line !== 0 && this._point === 1)) this._context.closePath();
    if (this._line >= 0) this._t = 1 - this._t, this._line = 1 - this._line;
  },
  point: function(x, y) {
    x = +x, y = +y;
    switch (this._point) {
      case 0: this._point = 1; this._line ? this._context.lineTo(x, y) : this._context.moveTo(x, y); break;
      case 1: this._point = 2; // proceed
      default: {
        if (this._t <= 0) {
          this._context.lineTo(this._x, y);
          this._context.lineTo(x, y);
        } else {
          var x1 = this._x * (1 - this._t) + x * this._t;
          this._context.lineTo(x1, this._y);
          this._context.lineTo(x1, y);
        }
        break;
      }
    }
    this._x = x, this._y = y;
  }
};

function curveStep(context) {
  return new Step(context, 0.5);
}

function stepBefore(context) {
  return new Step(context, 0);
}

function stepAfter(context) {
  return new Step(context, 1);
}

var lookup = {
  basis: { curve: curveBasis },
  bundle: {
    curve: curveBundle,
    tension: 'beta',
    value: 0.85
  },
  cardinal: {
    curve: curveCardinal,
    tension: 'tension',
    value: 0
  },
  catmullRom: {
    curve: curveCatmullRom,
    tension: 'alpha',
    value: 0.5
  },
  linear: { curve: curveLinear },
  monotone: {
    horizontal: monotoneY,
    vertical:   monotoneX
  },
  natural: { curve: curveNatural },
  step: { curve: curveStep },
  stepAfter: { curve: stepAfter },
  stepBefore: { curve: stepBefore }
};

function curves(type, orientation, tension) {
  var entry = lookup.hasOwnProperty(type) && lookup[type],
      curve = null;

  if (entry) {
    curve = entry.curve || entry[orientation || 'vertical'];
    if (entry.tension && tension != null) {
      curve = curve[entry.tension](tension);
    }
  }

  return curve;
}

// Path parsing and rendering code adapted from fabric.js -- Thanks!
var cmdlen = { m:2, l:2, h:1, v:1, c:6, s:4, q:4, t:2, a:7 };
var regexp = [/([MLHVCSQTAZmlhvcsqtaz])/g, /###/, /(\d)([-+])/g, /\s|,|###/];
function pathParse(pathstr) {
  var result = [],
      path,
      curr,
      chunks,
      parsed, param,
      cmd, len, i, j, n, m;

  // First, break path into command sequence
  path = pathstr
    .slice()
    .replace(regexp[0], '###$1')
    .split(regexp[1])
    .slice(1);

  // Next, parse each command in turn
  for (i=0, n=path.length; i<n; ++i) {
    curr = path[i];
    chunks = curr
      .slice(1)
      .trim()
      .replace(regexp[2],'$1###$2')
      .split(regexp[3]);
    cmd = curr.charAt(0);

    parsed = [cmd];
    for (j=0, m=chunks.length; j<m; ++j) {
      if ((param = +chunks[j]) === param) { // not NaN
        parsed.push(param);
      }
    }

    len = cmdlen[cmd.toLowerCase()];
    if (parsed.length-1 > len) {
      for (j=1, m=parsed.length; j<m; j+=len) {
        result.push([cmd].concat(parsed.slice(j, j+len)));
      }
    }
    else {
      result.push(parsed);
    }
  }

  return result;
}

var segmentCache = {};
var bezierCache = {};

var join = [].join;

// Copied from Inkscape svgtopdf, thanks!
function segments(x, y, rx, ry, large, sweep, rotateX, ox, oy) {
  var key = join.call(arguments);
  if (segmentCache[key]) {
    return segmentCache[key];
  }

  var th = rotateX * (Math.PI/180);
  var sin_th = Math.sin(th);
  var cos_th = Math.cos(th);
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  var px = cos_th * (ox - x) * 0.5 + sin_th * (oy - y) * 0.5;
  var py = cos_th * (oy - y) * 0.5 - sin_th * (ox - x) * 0.5;
  var pl = (px*px) / (rx*rx) + (py*py) / (ry*ry);
  if (pl > 1) {
    pl = Math.sqrt(pl);
    rx *= pl;
    ry *= pl;
  }

  var a00 = cos_th / rx;
  var a01 = sin_th / rx;
  var a10 = (-sin_th) / ry;
  var a11 = (cos_th) / ry;
  var x0 = a00 * ox + a01 * oy;
  var y0 = a10 * ox + a11 * oy;
  var x1 = a00 * x + a01 * y;
  var y1 = a10 * x + a11 * y;

  var d = (x1-x0) * (x1-x0) + (y1-y0) * (y1-y0);
  var sfactor_sq = 1 / d - 0.25;
  if (sfactor_sq < 0) sfactor_sq = 0;
  var sfactor = Math.sqrt(sfactor_sq);
  if (sweep == large) sfactor = -sfactor;
  var xc = 0.5 * (x0 + x1) - sfactor * (y1-y0);
  var yc = 0.5 * (y0 + y1) + sfactor * (x1-x0);

  var th0 = Math.atan2(y0-yc, x0-xc);
  var th1 = Math.atan2(y1-yc, x1-xc);

  var th_arc = th1-th0;
  if (th_arc < 0 && sweep === 1){
    th_arc += 2 * Math.PI;
  } else if (th_arc > 0 && sweep === 0) {
    th_arc -= 2 * Math.PI;
  }

  var segs = Math.ceil(Math.abs(th_arc / (Math.PI * 0.5 + 0.001)));
  var result = [];
  for (var i=0; i<segs; ++i) {
    var th2 = th0 + i * th_arc / segs;
    var th3 = th0 + (i+1) * th_arc / segs;
    result[i] = [xc, yc, th2, th3, rx, ry, sin_th, cos_th];
  }

  return (segmentCache[key] = result);
}

function bezier(params) {
  var key = join.call(params);
  if (bezierCache[key]) {
    return bezierCache[key];
  }

  var cx = params[0],
      cy = params[1],
      th0 = params[2],
      th1 = params[3],
      rx = params[4],
      ry = params[5],
      sin_th = params[6],
      cos_th = params[7];

  var a00 = cos_th * rx;
  var a01 = -sin_th * ry;
  var a10 = sin_th * rx;
  var a11 = cos_th * ry;

  var cos_th0 = Math.cos(th0);
  var sin_th0 = Math.sin(th0);
  var cos_th1 = Math.cos(th1);
  var sin_th1 = Math.sin(th1);

  var th_half = 0.5 * (th1 - th0);
  var sin_th_h2 = Math.sin(th_half * 0.5);
  var t = (8/3) * sin_th_h2 * sin_th_h2 / Math.sin(th_half);
  var x1 = cx + cos_th0 - t * sin_th0;
  var y1 = cy + sin_th0 + t * cos_th0;
  var x3 = cx + cos_th1;
  var y3 = cy + sin_th1;
  var x2 = x3 + t * sin_th1;
  var y2 = y3 - t * cos_th1;

  return (bezierCache[key] = [
    a00 * x1 + a01 * y1,  a10 * x1 + a11 * y1,
    a00 * x2 + a01 * y2,  a10 * x2 + a11 * y2,
    a00 * x3 + a01 * y3,  a10 * x3 + a11 * y3
  ]);
}

var temp$1 = ['l', 0, 0, 0, 0, 0, 0, 0];

function scale$1(current, s) {
  var c = (temp$1[0] = current[0]);
  if (c === 'a' || c === 'A') {
    temp$1[1] = s * current[1];
    temp$1[2] = s * current[2];
    temp$1[6] = s * current[6];
    temp$1[7] = s * current[7];
  } else {
    for (var i=1, n=current.length; i<n; ++i) {
      temp$1[i] = s * current[i];
    }
  }
  return temp$1;
}

function pathRender(context, path, l, t, s) {
  var current, // current instruction
      previous = null,
      x = 0, // current x
      y = 0, // current y
      controlX = 0, // current control point x
      controlY = 0, // current control point y
      tempX,
      tempY,
      tempControlX,
      tempControlY;

  if (l == null) l = 0;
  if (t == null) t = 0;
  if (s == null) s = 1;

  if (context.beginPath) context.beginPath();

  for (var i=0, len=path.length; i<len; ++i) {
    current = path[i];
    if (s !== 1) current = scale$1(current, s);

    switch (current[0]) { // first letter

      case 'l': // lineto, relative
        x += current[1];
        y += current[2];
        context.lineTo(x + l, y + t);
        break;

      case 'L': // lineto, absolute
        x = current[1];
        y = current[2];
        context.lineTo(x + l, y + t);
        break;

      case 'h': // horizontal lineto, relative
        x += current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'H': // horizontal lineto, absolute
        x = current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'v': // vertical lineto, relative
        y += current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'V': // verical lineto, absolute
        y = current[1];
        context.lineTo(x + l, y + t);
        break;

      case 'm': // moveTo, relative
        x += current[1];
        y += current[2];
        context.moveTo(x + l, y + t);
        break;

      case 'M': // moveTo, absolute
        x = current[1];
        y = current[2];
        context.moveTo(x + l, y + t);
        break;

      case 'c': // bezierCurveTo, relative
        tempX = x + current[5];
        tempY = y + current[6];
        controlX = x + current[3];
        controlY = y + current[4];
        context.bezierCurveTo(
          x + current[1] + l, // x1
          y + current[2] + t, // y1
          controlX + l, // x2
          controlY + t, // y2
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'C': // bezierCurveTo, absolute
        x = current[5];
        y = current[6];
        controlX = current[3];
        controlY = current[4];
        context.bezierCurveTo(
          current[1] + l,
          current[2] + t,
          controlX + l,
          controlY + t,
          x + l,
          y + t
        );
        break;

      case 's': // shorthand cubic bezierCurveTo, relative
        // transform to absolute x,y
        tempX = x + current[3];
        tempY = y + current[4];
        // calculate reflection of previous control points
        controlX = 2 * x - controlX;
        controlY = 2 * y - controlY;
        context.bezierCurveTo(
          controlX + l,
          controlY + t,
          x + current[1] + l,
          y + current[2] + t,
          tempX + l,
          tempY + t
        );

        // set control point to 2nd one of this command
        // the first control point is assumed to be the reflection of
        // the second control point on the previous command relative
        // to the current point.
        controlX = x + current[1];
        controlY = y + current[2];

        x = tempX;
        y = tempY;
        break;

      case 'S': // shorthand cubic bezierCurveTo, absolute
        tempX = current[3];
        tempY = current[4];
        // calculate reflection of previous control points
        controlX = 2*x - controlX;
        controlY = 2*y - controlY;
        context.bezierCurveTo(
          controlX + l,
          controlY + t,
          current[1] + l,
          current[2] + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        // set control point to 2nd one of this command
        // the first control point is assumed to be the reflection of
        // the second control point on the previous command relative
        // to the current point.
        controlX = current[1];
        controlY = current[2];

        break;

      case 'q': // quadraticCurveTo, relative
        // transform to absolute x,y
        tempX = x + current[3];
        tempY = y + current[4];

        controlX = x + current[1];
        controlY = y + current[2];

        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'Q': // quadraticCurveTo, absolute
        tempX = current[3];
        tempY = current[4];

        context.quadraticCurveTo(
          current[1] + l,
          current[2] + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = current[1];
        controlY = current[2];
        break;

      case 't': // shorthand quadraticCurveTo, relative

        // transform to absolute x,y
        tempX = x + current[1];
        tempY = y + current[2];

        if (previous[0].match(/[QqTt]/) === null) {
          // If there is no previous command or if the previous command was not a Q, q, T or t,
          // assume the control point is coincident with the current point
          controlX = x;
          controlY = y;
        }
        else if (previous[0] === 't') {
          // calculate reflection of previous control points for t
          controlX = 2 * x - tempControlX;
          controlY = 2 * y - tempControlY;
        }
        else if (previous[0] === 'q') {
          // calculate reflection of previous control points for q
          controlX = 2 * x - controlX;
          controlY = 2 * y - controlY;
        }

        tempControlX = controlX;
        tempControlY = controlY;

        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        controlX = x + current[1];
        controlY = y + current[2];
        break;

      case 'T':
        tempX = current[1];
        tempY = current[2];

        // calculate reflection of previous control points
        controlX = 2 * x - controlX;
        controlY = 2 * y - controlY;
        context.quadraticCurveTo(
          controlX + l,
          controlY + t,
          tempX + l,
          tempY + t
        );
        x = tempX;
        y = tempY;
        break;

      case 'a':
        drawArc(context, x + l, y + t, [
          current[1],
          current[2],
          current[3],
          current[4],
          current[5],
          current[6] + x + l,
          current[7] + y + t
        ]);
        x += current[6];
        y += current[7];
        break;

      case 'A':
        drawArc(context, x + l, y + t, [
          current[1],
          current[2],
          current[3],
          current[4],
          current[5],
          current[6] + l,
          current[7] + t
        ]);
        x = current[6];
        y = current[7];
        break;

      case 'z':
      case 'Z':
        context.closePath();
        break;
    }
    previous = current;
  }
}

function drawArc(context, x, y, coords) {
  var seg = segments(
    coords[5], // end x
    coords[6], // end y
    coords[0], // radius x
    coords[1], // radius y
    coords[3], // large flag
    coords[4], // sweep flag
    coords[2], // rotation
    x, y
  );
  for (var i=0; i<seg.length; ++i) {
    var bez = bezier(seg[i]);
    context.bezierCurveTo(bez[0], bez[1], bez[2], bez[3], bez[4], bez[5]);
  }
}

var tau$3 = 2 * Math.PI;
var halfSqrt3 = Math.sqrt(3) / 2;
var builtins = {
  'circle': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(r, 0);
      context.arc(0, 0, r, 0, tau$3);
    }
  },
  'cross': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          s = r / 2.5;
      context.moveTo(-r, -s);
      context.lineTo(-r, s);
      context.lineTo(-s, s);
      context.lineTo(-s, r);
      context.lineTo(s, r);
      context.lineTo(s, s);
      context.lineTo(r, s);
      context.lineTo(r, -s);
      context.lineTo(s, -s);
      context.lineTo(s, -r);
      context.lineTo(-s, -r);
      context.lineTo(-s, -s);
      context.closePath();
    }
  },
  'diamond': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2;
      context.moveTo(-r, 0);
      context.lineTo(0, -r);
      context.lineTo(r, 0);
      context.lineTo(0, r);
      context.closePath();
    }
  },
  'square': {
    draw: function(context, size) {
      var w = Math.sqrt(size),
          x = -w / 2;
      context.rect(x, x, w, w);
    }
  },
  'triangle-up': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(0, -h);
      context.lineTo(-r, h);
      context.lineTo(r, h);
      context.closePath();
    }
  },
  'triangle-down': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(0, h);
      context.lineTo(-r, -h);
      context.lineTo(r, -h);
      context.closePath();
    }
  },
  'triangle-right': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(h, 0);
      context.lineTo(-h, -r);
      context.lineTo(-h, r);
      context.closePath();
    }
  },
  'triangle-left': {
    draw: function(context, size) {
      var r = Math.sqrt(size) / 2,
          h = halfSqrt3 * r;
      context.moveTo(-h, 0);
      context.lineTo(h, -r);
      context.lineTo(h, r);
      context.closePath();
    }
  }
};

function symbols$1(_) {
  return builtins.hasOwnProperty(_) ? builtins[_] : customSymbol(_);
}

var custom = {};

function customSymbol(path) {
  if (!custom.hasOwnProperty(path)) {
    var parsed = pathParse(path);
    custom[path] = {
      draw: function(context, size) {
        pathRender(context, parsed, 0, 0, Math.sqrt(size));
      }
    };
  }
  return custom[path];
}

function rectangleX(d) {
  return d.x;
}

function rectangleY(d) {
  return d.y;
}

function rectangleWidth(d) {
  return d.width;
}

function rectangleHeight(d) {
  return d.height;
}

function constant$9(_) {
  return function() { return _; };
}

function vg_rect() {
  var x = rectangleX,
      y = rectangleY,
      width = rectangleWidth,
      height = rectangleHeight,
      cornerRadius = constant$9(0),
      context = null;

  function rectangle(_, x0, y0) {
    var buffer,
        x1 = x0 != null ? x0 : +x.call(this, _),
        y1 = y0 != null ? y0 : +y.call(this, _),
        w  = +width.call(this, _),
        h  = +height.call(this, _),
        cr = +cornerRadius.call(this, _);

    if (!context) context = buffer = path();

    if (cr <= 0) {
      context.rect(x1, y1, w, h);
    } else {
      var x2 = x1 + w,
          y2 = y1 + h;
      context.moveTo(x1 + cr, y1);
      context.lineTo(x2 - cr, y1);
      context.quadraticCurveTo(x2, y1, x2, y1 + cr);
      context.lineTo(x2, y2 - cr);
      context.quadraticCurveTo(x2, y2, x2 - cr, y2);
      context.lineTo(x1 + cr, y2);
      context.quadraticCurveTo(x1, y2, x1, y2 - cr);
      context.lineTo(x1, y1 + cr);
      context.quadraticCurveTo(x1, y1, x1 + cr, y1);
      context.closePath();
    }

    if (buffer) return context = null, buffer + '' || null;
  }

  rectangle.x = function(_) {
    return arguments.length ? (x = typeof _ === 'function' ? _ : constant$9(+_), rectangle) : x;
  };

  rectangle.y = function(_) {
    return arguments.length ? (y = typeof _ === 'function' ? _ : constant$9(+_), rectangle) : y;
  };

  rectangle.width = function(_) {
    return arguments.length ? (width = typeof _ === 'function' ? _ : constant$9(+_), rectangle) : width;
  };

  rectangle.height = function(_) {
    return arguments.length ? (height = typeof _ === 'function' ? _ : constant$9(+_), rectangle) : height;
  };

  rectangle.cornerRadius = function(_) {
    return arguments.length ? (cornerRadius = typeof _ === 'function' ? _ : constant$9(+_), rectangle) : cornerRadius;
  };

  rectangle.context = function(_) {
    return arguments.length ? (context = _ == null ? null : _, rectangle) : context;
  };

  return rectangle;
}

var pi$3 = Math.PI;

function vg_trail() {
  var x,
      y,
      size,
      defined,
      context = null,
      ready, x1, y1, r1;

  function point(x2, y2, w2) {
    var r2 = w2 / 2;

    if (ready) {
      // get normal vector
      var ux = y1 - y2,
          uy = x2 - x1,
          ud = Math.sqrt(ux * ux + uy * uy),
          rx = (ux /= ud) * r1,
          ry = (uy /= ud) * r1,
          t = Math.atan2(uy, ux);

      // draw segment
      context.moveTo(x1 - rx, y1 - ry);
      context.lineTo(x2 - ux * r2, y2 - uy * r2);
      context.arc(x2, y2, r2, t - pi$3, t);
      context.lineTo(x1 + rx, y1 + ry);
      context.arc(x1, y1, r1, t, t + pi$3);
      context.closePath();
    } else {
      ready = 1;
    }
    x1 = x2, y1 = y2, r1 = r2;
  }

  function trail(data) {
    var i,
        n = data.length,
        d,
        defined0 = false,
        buffer;

    if (context == null) context = buffer = path();

    for (i = 0; i <= n; ++i) {
      if (!(i < n && defined(d = data[i], i, data)) === defined0) {
        if (defined0 = !defined0) ready = 0;
      }
      if (defined0) point(+x(d, i, data), +y(d, i, data), +size(d, i, data));
    }

    if (buffer) return context = null, buffer + '' || null;
  }

  trail.x = function(_) {
    return arguments.length ? (x = _, trail) : x;
  };

  trail.y = function(_) {
    return arguments.length ? (y = _, trail) : y;
  };

  trail.size = function(_) {
    return arguments.length ? (size = _, trail) : size;
  };

  trail.defined = function(_) {
    return arguments.length ? (defined = _, trail) : defined;
  };

  trail.context = function(_) {
    return arguments.length ? (_ == null ? context = null : context = _, trail) : context;
  };

  return trail;
}

var index$2 = parse$2

/**
 * expected argument lengths
 * @type {Object}
 */

var length$2 = {a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0}

/**
 * segment pattern
 * @type {RegExp}
 */

var segment = /([astvzqmhlc])([^astvzqmhlc]*)/ig

/**
 * parse an svg path data string. Generates an Array
 * of commands where each command is an Array of the
 * form `[command, arg1, arg2, ...]`
 *
 * @param {String} path
 * @return {Array}
 */

function parse$2(path) {
	var data = []
	path.replace(segment, function(_, command, args){
		var type = command.toLowerCase()
		args = parseValues(args)

		// overloaded moveTo
		if (type == 'm' && args.length > 2) {
			data.push([command].concat(args.splice(0, 2)))
			type = 'l'
			command = command == 'm' ? 'l' : 'L'
		}

		while (true) {
			if (args.length == length$2[type]) {
				args.unshift(command)
				return data.push(args)
			}
			if (args.length < length$2[type]) throw new Error('malformed path data')
			data.push([command].concat(args.splice(0, length$2[type])))
		}
	})
	return data
}

var number$4 = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig

function parseValues(args) {
	var numbers = args.match(number$4)
	return numbers ? numbers.map(Number) : []
}

function getSqDist(p1, p2) {
    var dx = p1[0] - p2[0],
        dy = p1[1] - p2[1];

    return dx * dx + dy * dy;
}

// basic distance-based simplification
var __moduleExports = function simplifyRadialDist(points, tolerance) {
    if (points.length<=1)
        return points;
    tolerance = typeof tolerance === 'number' ? tolerance : 1;
    var sqTolerance = tolerance * tolerance;
    
    var prevPoint = points[0],
        newPoints = [prevPoint],
        point;

    for (var i = 1, len = points.length; i < len; i++) {
        point = points[i];

        if (getSqDist(point, prevPoint) > sqTolerance) {
            newPoints.push(point);
            prevPoint = point;
        }
    }

    if (prevPoint !== point) newPoints.push(point);

    return newPoints;
}

// square distance from a point to a segment
function getSqSegDist(p, p1, p2) {
    var x = p1[0],
        y = p1[1],
        dx = p2[0] - x,
        dy = p2[1] - y;

    if (dx !== 0 || dy !== 0) {

        var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);

        if (t > 1) {
            x = p2[0];
            y = p2[1];

        } else if (t > 0) {
            x += dx * t;
            y += dy * t;
        }
    }

    dx = p[0] - x;
    dy = p[1] - y;

    return dx * dx + dy * dy;
}

function simplifyDPStep(points, first, last, sqTolerance, simplified) {
    var maxSqDist = sqTolerance,
        index;

    for (var i = first + 1; i < last; i++) {
        var sqDist = getSqSegDist(points[i], points[first], points[last]);

        if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
        }
    }

    if (maxSqDist > sqTolerance) {
        if (index - first > 1) simplifyDPStep(points, first, index, sqTolerance, simplified);
        simplified.push(points[index]);
        if (last - index > 1) simplifyDPStep(points, index, last, sqTolerance, simplified);
    }
}

// simplification using Ramer-Douglas-Peucker algorithm
var __moduleExports$1 = function simplifyDouglasPeucker(points, tolerance) {
    if (points.length<=1)
        return points;
    tolerance = typeof tolerance === 'number' ? tolerance : 1;
    var sqTolerance = tolerance * tolerance;
    
    var last = points.length - 1;

    var simplified = [points[0]];
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);

    return simplified;
}

var simplifyRadialDist = __moduleExports
var simplifyDouglasPeucker = __moduleExports$1

//simplifies using both algorithms
var index$3 = function simplify(points, tolerance) {
    points = simplifyRadialDist(points, tolerance);
    points = simplifyDouglasPeucker(points, tolerance);
    return points;
}

var radialDistance = simplifyRadialDist;
var douglasPeucker = simplifyDouglasPeucker;

index$3.radialDistance = radialDistance;
index$3.douglasPeucker = douglasPeucker;

function clone(point) { //TODO: use gl-vec2 for this
    return [point[0], point[1]]
}

function vec2(x, y) {
    return [x, y]
}

var __moduleExports$3 = function createBezierBuilder(opt) {
    opt = opt||{}

    var RECURSION_LIMIT = typeof opt.recursion === 'number' ? opt.recursion : 8
    var FLT_EPSILON = typeof opt.epsilon === 'number' ? opt.epsilon : 1.19209290e-7
    var PATH_DISTANCE_EPSILON = typeof opt.pathEpsilon === 'number' ? opt.pathEpsilon : 1.0

    var curve_angle_tolerance_epsilon = typeof opt.angleEpsilon === 'number' ? opt.angleEpsilon : 0.01
    var m_angle_tolerance = opt.angleTolerance || 0
    var m_cusp_limit = opt.cuspLimit || 0

    return function bezierCurve(start, c1, c2, end, scale, points) {
        if (!points)
            points = []

        scale = typeof scale === 'number' ? scale : 1.0
        var distanceTolerance = PATH_DISTANCE_EPSILON / scale
        distanceTolerance *= distanceTolerance
        begin(start, c1, c2, end, points, distanceTolerance)
        return points
    }


    ////// Based on:
    ////// https://github.com/pelson/antigrain/blob/master/agg-2.4/src/agg_curves.cpp

    function begin(start, c1, c2, end, points, distanceTolerance) {
        points.push(clone(start))
        var x1 = start[0],
            y1 = start[1],
            x2 = c1[0],
            y2 = c1[1],
            x3 = c2[0],
            y3 = c2[1],
            x4 = end[0],
            y4 = end[1]
        recursive(x1, y1, x2, y2, x3, y3, x4, y4, points, distanceTolerance, 0)
        points.push(clone(end))
    }

    function recursive(x1, y1, x2, y2, x3, y3, x4, y4, points, distanceTolerance, level) {
        if(level > RECURSION_LIMIT) 
            return

        var pi = Math.PI

        // Calculate all the mid-points of the line segments
        //----------------------
        var x12   = (x1 + x2) / 2
        var y12   = (y1 + y2) / 2
        var x23   = (x2 + x3) / 2
        var y23   = (y2 + y3) / 2
        var x34   = (x3 + x4) / 2
        var y34   = (y3 + y4) / 2
        var x123  = (x12 + x23) / 2
        var y123  = (y12 + y23) / 2
        var x234  = (x23 + x34) / 2
        var y234  = (y23 + y34) / 2
        var x1234 = (x123 + x234) / 2
        var y1234 = (y123 + y234) / 2

        if(level > 0) { // Enforce subdivision first time
            // Try to approximate the full cubic curve by a single straight line
            //------------------
            var dx = x4-x1
            var dy = y4-y1

            var d2 = Math.abs((x2 - x4) * dy - (y2 - y4) * dx)
            var d3 = Math.abs((x3 - x4) * dy - (y3 - y4) * dx)

            var da1, da2

            if(d2 > FLT_EPSILON && d3 > FLT_EPSILON) {
                // Regular care
                //-----------------
                if((d2 + d3)*(d2 + d3) <= distanceTolerance * (dx*dx + dy*dy)) {
                    // If the curvature doesn't exceed the distanceTolerance value
                    // we tend to finish subdivisions.
                    //----------------------
                    if(m_angle_tolerance < curve_angle_tolerance_epsilon) {
                        points.push(vec2(x1234, y1234))
                        return
                    }

                    // Angle & Cusp Condition
                    //----------------------
                    var a23 = Math.atan2(y3 - y2, x3 - x2)
                    da1 = Math.abs(a23 - Math.atan2(y2 - y1, x2 - x1))
                    da2 = Math.abs(Math.atan2(y4 - y3, x4 - x3) - a23)
                    if(da1 >= pi) da1 = 2*pi - da1
                    if(da2 >= pi) da2 = 2*pi - da2

                    if(da1 + da2 < m_angle_tolerance) {
                        // Finally we can stop the recursion
                        //----------------------
                        points.push(vec2(x1234, y1234))
                        return
                    }

                    if(m_cusp_limit !== 0.0) {
                        if(da1 > m_cusp_limit) {
                            points.push(vec2(x2, y2))
                            return
                        }

                        if(da2 > m_cusp_limit) {
                            points.push(vec2(x3, y3))
                            return
                        }
                    }
                }
            }
            else {
                if(d2 > FLT_EPSILON) {
                    // p1,p3,p4 are collinear, p2 is considerable
                    //----------------------
                    if(d2 * d2 <= distanceTolerance * (dx*dx + dy*dy)) {
                        if(m_angle_tolerance < curve_angle_tolerance_epsilon) {
                            points.push(vec2(x1234, y1234))
                            return
                        }

                        // Angle Condition
                        //----------------------
                        da1 = Math.abs(Math.atan2(y3 - y2, x3 - x2) - Math.atan2(y2 - y1, x2 - x1))
                        if(da1 >= pi) da1 = 2*pi - da1

                        if(da1 < m_angle_tolerance) {
                            points.push(vec2(x2, y2))
                            points.push(vec2(x3, y3))
                            return
                        }

                        if(m_cusp_limit !== 0.0) {
                            if(da1 > m_cusp_limit) {
                                points.push(vec2(x2, y2))
                                return
                            }
                        }
                    }
                }
                else if(d3 > FLT_EPSILON) {
                    // p1,p2,p4 are collinear, p3 is considerable
                    //----------------------
                    if(d3 * d3 <= distanceTolerance * (dx*dx + dy*dy)) {
                        if(m_angle_tolerance < curve_angle_tolerance_epsilon) {
                            points.push(vec2(x1234, y1234))
                            return
                        }

                        // Angle Condition
                        //----------------------
                        da1 = Math.abs(Math.atan2(y4 - y3, x4 - x3) - Math.atan2(y3 - y2, x3 - x2))
                        if(da1 >= pi) da1 = 2*pi - da1

                        if(da1 < m_angle_tolerance) {
                            points.push(vec2(x2, y2))
                            points.push(vec2(x3, y3))
                            return
                        }

                        if(m_cusp_limit !== 0.0) {
                            if(da1 > m_cusp_limit)
                            {
                                points.push(vec2(x3, y3))
                                return
                            }
                        }
                    }
                }
                else {
                    // Collinear case
                    //-----------------
                    dx = x1234 - (x1 + x4) / 2
                    dy = y1234 - (y1 + y4) / 2
                    if(dx*dx + dy*dy <= distanceTolerance) {
                        points.push(vec2(x1234, y1234))
                        return
                    }
                }
            }
        }

        // Continue subdivision
        //----------------------
        recursive(x1, y1, x12, y12, x123, y123, x1234, y1234, points, distanceTolerance, level + 1) 
        recursive(x1234, y1234, x234, y234, x34, y34, x4, y4, points, distanceTolerance, level + 1) 
    }
}

var __moduleExports$2 = __moduleExports$3()

var __moduleExports$4 = absolutize

/**
 * redefine `path` with absolute coordinates
 *
 * @param {Array} path
 * @return {Array}
 */

function absolutize(path){
	var startX = 0
	var startY = 0
	var x = 0
	var y = 0

	return path.map(function(seg){
		seg = seg.slice()
		var type = seg[0]
		var command = type.toUpperCase()

		// is relative
		if (type != command) {
			seg[0] = command
			switch (type) {
				case 'a':
					seg[6] += x
					seg[7] += y
					break
				case 'v':
					seg[1] += y
					break
				case 'h':
					seg[1] += x
					break
				default:
					for (var i = 1; i < seg.length;) {
						seg[i++] += x
						seg[i++] += y
					}
			}
		}

		// update cursor state
		switch (command) {
			case 'Z':
				x = startX
				y = startY
				break
			case 'H':
				x = seg[1]
				break
			case 'V':
				y = seg[1]
				break
			case 'M':
				x = startX = seg[1]
				y = startY = seg[2]
				break
			default:
				x = seg[seg.length - 2]
				y = seg[seg.length - 1]
		}

		return seg
	})
}

var π = Math.PI
var _120 = radians$1(120)

var __moduleExports$5 = normalize

/**
 * describe `path` in terms of cubic bézier 
 * curves and move commands
 *
 * @param {Array} path
 * @return {Array}
 */

function normalize(path){
	// init state
	var prev
	var result = []
	var bezierX = 0
	var bezierY = 0
	var startX = 0
	var startY = 0
	var quadX = null
	var quadY = null
	var x = 0
	var y = 0

	for (var i = 0, len = path.length; i < len; i++) {
		var seg = path[i]
		var command = seg[0]
		switch (command) {
			case 'M':
				startX = seg[1]
				startY = seg[2]
				break
			case 'A':
				seg = arc$2(x, y,seg[1],seg[2],radians$1(seg[3]),seg[4],seg[5],seg[6],seg[7])
				// split multi part
				seg.unshift('C')
				if (seg.length > 7) {
					result.push(seg.splice(0, 7))
					seg.unshift('C')
				}
				break
			case 'S':
				// default control point
				var cx = x
				var cy = y
				if (prev == 'C' || prev == 'S') {
					cx += cx - bezierX // reflect the previous command's control
					cy += cy - bezierY // point relative to the current point
				}
				seg = ['C', cx, cy, seg[1], seg[2], seg[3], seg[4]]
				break
			case 'T':
				if (prev == 'Q' || prev == 'T') {
					quadX = x * 2 - quadX // as with 'S' reflect previous control point
					quadY = y * 2 - quadY
				} else {
					quadX = x
					quadY = y
				}
				seg = quadratic(x, y, quadX, quadY, seg[1], seg[2])
				break
			case 'Q':
				quadX = seg[1]
				quadY = seg[2]
				seg = quadratic(x, y, seg[1], seg[2], seg[3], seg[4])
				break
			case 'L':
				seg = line$3(x, y, seg[1], seg[2])
				break
			case 'H':
				seg = line$3(x, y, seg[1], y)
				break
			case 'V':
				seg = line$3(x, y, x, seg[1])
				break
			case 'Z':
				seg = line$3(x, y, startX, startY)
				break
		}

		// update state
		prev = command
		x = seg[seg.length - 2]
		y = seg[seg.length - 1]
		if (seg.length > 4) {
			bezierX = seg[seg.length - 4]
			bezierY = seg[seg.length - 3]
		} else {
			bezierX = x
			bezierY = y
		}
		result.push(seg)
	}

	return result
}

function line$3(x1, y1, x2, y2){
	return ['C', x1, y1, x2, y2, x2, y2]
}

function quadratic(x1, y1, cx, cy, x2, y2){
	return [
		'C',
		x1/3 + (2/3) * cx,
		y1/3 + (2/3) * cy,
		x2/3 + (2/3) * cx,
		y2/3 + (2/3) * cy,
		x2,
		y2
	]
}

// This function is ripped from 
// github.com/DmitryBaranovskiy/raphael/blob/4d97d4/raphael.js#L2216-L2304 
// which references w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
// TODO: make it human readable

function arc$2(x1, y1, rx, ry, angle, large_arc_flag, sweep_flag, x2, y2, recursive) {
	if (!recursive) {
		var xy = rotate(x1, y1, -angle)
		x1 = xy.x
		y1 = xy.y
		xy = rotate(x2, y2, -angle)
		x2 = xy.x
		y2 = xy.y
		var x = (x1 - x2) / 2
		var y = (y1 - y2) / 2
		var h = (x * x) / (rx * rx) + (y * y) / (ry * ry)
		if (h > 1) {
			h = Math.sqrt(h)
			rx = h * rx
			ry = h * ry
		}
		var rx2 = rx * rx
		var ry2 = ry * ry
		var k = (large_arc_flag == sweep_flag ? -1 : 1)
			* Math.sqrt(Math.abs((rx2 * ry2 - rx2 * y * y - ry2 * x * x) / (rx2 * y * y + ry2 * x * x)))
		if (k == Infinity) k = 1 // neutralize
		var cx = k * rx * y / ry + (x1 + x2) / 2
		var cy = k * -ry * x / rx + (y1 + y2) / 2
		var f1 = Math.asin(((y1 - cy) / ry).toFixed(9))
		var f2 = Math.asin(((y2 - cy) / ry).toFixed(9))

		f1 = x1 < cx ? π - f1 : f1
		f2 = x2 < cx ? π - f2 : f2
		if (f1 < 0) f1 = π * 2 + f1
		if (f2 < 0) f2 = π * 2 + f2
		if (sweep_flag && f1 > f2) f1 = f1 - π * 2
		if (!sweep_flag && f2 > f1) f2 = f2 - π * 2
	} else {
		f1 = recursive[0]
		f2 = recursive[1]
		cx = recursive[2]
		cy = recursive[3]
	}
	// greater than 120 degrees requires multiple segments
	if (Math.abs(f2 - f1) > _120) {
		var f2old = f2
		var x2old = x2
		var y2old = y2
		f2 = f1 + _120 * (sweep_flag && f2 > f1 ? 1 : -1)
		x2 = cx + rx * Math.cos(f2)
		y2 = cy + ry * Math.sin(f2)
		var res = arc$2(x2, y2, rx, ry, angle, 0, sweep_flag, x2old, y2old, [f2, f2old, cx, cy])
	}
	var t = Math.tan((f2 - f1) / 4)
	var hx = 4 / 3 * rx * t
	var hy = 4 / 3 * ry * t
	var curve = [
		2 * x1 - (x1 + hx * Math.sin(f1)),
		2 * y1 - (y1 - hy * Math.cos(f1)),
		x2 + hx * Math.sin(f2),
		y2 - hy * Math.cos(f2),
		x2,
		y2
	]
	if (recursive) return curve
	if (res) curve = curve.concat(res)
	for (var i = 0; i < curve.length;) {
		var rot = rotate(curve[i], curve[i+1], angle)
		curve[i++] = rot.x
		curve[i++] = rot.y
	}
	return curve
}

function rotate(x, y, rad){
	return {
		x: x * Math.cos(rad) - y * Math.sin(rad),
		y: x * Math.sin(rad) + y * Math.cos(rad)
	}
}

function radians$1(degress){
	return degress * (π / 180)
}

var __moduleExports$6 = function vec2Copy(out, a) {
    out[0] = a[0]
    out[1] = a[1]
    return out
}

var bezier$1 = __moduleExports$2
var abs$1 = __moduleExports$4
var norm = __moduleExports$5
var copy$2 = __moduleExports$6

function set$3(out, x, y) {
    out[0] = x
    out[1] = y
    return out
}

var tmp1 = [0,0];
var tmp2 = [0,0];
var tmp3 = [0,0];
function bezierTo(points, scale, start, seg) {
    bezier$1(start, 
        set$3(tmp1, seg[1], seg[2]), 
        set$3(tmp2, seg[3], seg[4]),
        set$3(tmp3, seg[5], seg[6]), scale, points)
}

var index$4 = function contours(svg, scale) {
    var paths = []

    var points = []
    var pen = [0, 0]
    norm(abs$1(svg)).forEach(function(segment, i, self) {
        if (segment[0] === 'M') {
            copy$2(pen, segment.slice(1))
            if (points.length>0) {
                paths.push(points)
                points = []
            }
        } else if (segment[0] === 'C') {
            bezierTo(points, scale, pen, segment)
            set$3(pen, segment[5], segment[6])
        } else {
            throw new Error('illegal type in SVG: '+segment[0])
        }
    })
    if (points.length>0)
        paths.push(points)
    return paths
}

/* Public API */

	var Tess2$1 = {};

	var __moduleExports$8 = Tess2$1;
	
	Tess2$1.WINDING_ODD = 0;
	Tess2$1.WINDING_NONZERO = 1;
	Tess2$1.WINDING_POSITIVE = 2;
	Tess2$1.WINDING_NEGATIVE = 3;
	Tess2$1.WINDING_ABS_GEQ_TWO = 4;

	Tess2$1.POLYGONS = 0;
	Tess2$1.CONNECTED_POLYGONS = 1;
	Tess2$1.BOUNDARY_CONTOURS = 2;

	Tess2$1.tesselate = function(opts) {
		var debug =  opts.debug || false;
		var tess = new Tesselator();
		for (var i = 0; i < opts.contours.length; i++) {
			tess.addContour(opts.vertexSize || 2, opts.contours[i]);
		}
		tess.tesselate(opts.windingRule || Tess2$1.WINDING_ODD,
					   opts.elementType || Tess2$1.POLYGONS,
					   opts.polySize || 3,
					   opts.vertexSize || 2,
					   opts.normal || [0,0,1]);
		return {
			vertices: tess.vertices,
			vertexIndices: tess.vertexIndices,
			vertexCount: tess.vertexCount,
			elements: tess.elements,
			elementCount: tess.elementCount,
			mesh: debug ? tess.mesh : undefined
		};
	};

	/* Internal */

	var assert = function(cond) {
		if (!cond) {
			throw "Assertion Failed!";
		}
	}

	/* The mesh structure is similar in spirit, notation, and operations
	* to the "quad-edge" structure (see L. Guibas and J. Stolfi, Primitives
	* for the manipulation of general subdivisions and the computation of
	* Voronoi diagrams, ACM Transactions on Graphics, 4(2):74-123, April 1985).
	* For a simplified description, see the course notes for CS348a,
	* "Mathematical Foundations of Computer Graphics", available at the
	* Stanford bookstore (and taught during the fall quarter).
	* The implementation also borrows a tiny subset of the graph-based approach
	* use in Mantyla's Geometric Work Bench (see M. Mantyla, An Introduction
	* to Sold Modeling, Computer Science Press, Rockville, Maryland, 1988).
	*
	* The fundamental data structure is the "half-edge".  Two half-edges
	* go together to make an edge, but they point in opposite directions.
	* Each half-edge has a pointer to its mate (the "symmetric" half-edge Sym),
	* its origin vertex (Org), the face on its left side (Lface), and the
	* adjacent half-edges in the CCW direction around the origin vertex
	* (Onext) and around the left face (Lnext).  There is also a "next"
	* pointer for the global edge list (see below).
	*
	* The notation used for mesh navigation:
	*  Sym   = the mate of a half-edge (same edge, but opposite direction)
	*  Onext = edge CCW around origin vertex (keep same origin)
	*  Dnext = edge CCW around destination vertex (keep same dest)
	*  Lnext = edge CCW around left face (dest becomes new origin)
	*  Rnext = edge CCW around right face (origin becomes new dest)
	*
	* "prev" means to substitute CW for CCW in the definitions above.
	*
	* The mesh keeps global lists of all vertices, faces, and edges,
	* stored as doubly-linked circular lists with a dummy header node.
	* The mesh stores pointers to these dummy headers (vHead, fHead, eHead).
	*
	* The circular edge list is special; since half-edges always occur
	* in pairs (e and e->Sym), each half-edge stores a pointer in only
	* one direction.  Starting at eHead and following the e->next pointers
	* will visit each *edge* once (ie. e or e->Sym, but not both).
	* e->Sym stores a pointer in the opposite direction, thus it is
	* always true that e->Sym->next->Sym->next == e.
	*
	* Each vertex has a pointer to next and previous vertices in the
	* circular list, and a pointer to a half-edge with this vertex as
	* the origin (NULL if this is the dummy header).  There is also a
	* field "data" for client data.
	*
	* Each face has a pointer to the next and previous faces in the
	* circular list, and a pointer to a half-edge with this face as
	* the left face (NULL if this is the dummy header).  There is also
	* a field "data" for client data.
	*
	* Note that what we call a "face" is really a loop; faces may consist
	* of more than one loop (ie. not simply connected), but there is no
	* record of this in the data structure.  The mesh may consist of
	* several disconnected regions, so it may not be possible to visit
	* the entire mesh by starting at a half-edge and traversing the edge
	* structure.
	*
	* The mesh does NOT support isolated vertices; a vertex is deleted along
	* with its last edge.  Similarly when two faces are merged, one of the
	* faces is deleted (see tessMeshDelete below).  For mesh operations,
	* all face (loop) and vertex pointers must not be NULL.  However, once
	* mesh manipulation is finished, TESSmeshZapFace can be used to delete
	* faces of the mesh, one at a time.  All external faces can be "zapped"
	* before the mesh is returned to the client; then a NULL face indicates
	* a region which is not part of the output polygon.
	*/

	function TESSvertex() {
		this.next = null;	/* next vertex (never NULL) */
		this.prev = null;	/* previous vertex (never NULL) */
		this.anEdge = null;	/* a half-edge with this origin */

		/* Internal data (keep hidden) */
		this.coords = [0,0,0];	/* vertex location in 3D */
		this.s = 0.0;
		this.t = 0.0;			/* projection onto the sweep plane */
		this.pqHandle = 0;		/* to allow deletion from priority queue */
		this.n = 0;				/* to allow identify unique vertices */
		this.idx = 0;			/* to allow map result to original verts */
	} 

	function TESSface() {
		this.next = null;		/* next face (never NULL) */
		this.prev = null;		/* previous face (never NULL) */
		this.anEdge = null;		/* a half edge with this left face */

		/* Internal data (keep hidden) */
		this.trail = null;		/* "stack" for conversion to strips */
		this.n = 0;				/* to allow identiy unique faces */
		this.marked = false;	/* flag for conversion to strips */
		this.inside = false;	/* this face is in the polygon interior */
	};

	function TESShalfEdge(side) {
		this.next = null;		/* doubly-linked list (prev==Sym->next) */
		this.Sym = null;		/* same edge, opposite direction */
		this.Onext = null;		/* next edge CCW around origin */
		this.Lnext = null;		/* next edge CCW around left face */
		this.Org = null;		/* origin vertex (Overtex too long) */
		this.Lface = null;		/* left face */

		/* Internal data (keep hidden) */
		this.activeRegion = null;	/* a region with this upper edge (sweep.c) */
		this.winding = 0;			/* change in winding number when crossing
									   from the right face to the left face */
		this.side = side;
	};

	TESShalfEdge.prototype = {
		get Rface() { return this.Sym.Lface; },
		set Rface(v) { this.Sym.Lface = v; },
		get Dst() { return this.Sym.Org; },
		set Dst(v) { this.Sym.Org = v; },
		get Oprev() { return this.Sym.Lnext; },
		set Oprev(v) { this.Sym.Lnext = v; },
		get Lprev() { return this.Onext.Sym; },
		set Lprev(v) { this.Onext.Sym = v; },
		get Dprev() { return this.Lnext.Sym; },
		set Dprev(v) { this.Lnext.Sym = v; },
		get Rprev() { return this.Sym.Onext; },
		set Rprev(v) { this.Sym.Onext = v; },
		get Dnext() { return /*this.Rprev*/this.Sym.Onext.Sym; },  /* 3 pointers */
		set Dnext(v) { /*this.Rprev*/this.Sym.Onext.Sym = v; },  /* 3 pointers */
		get Rnext() { return /*this.Oprev*/this.Sym.Lnext.Sym; },  /* 3 pointers */
		set Rnext(v) { /*this.Oprev*/this.Sym.Lnext.Sym = v; },  /* 3 pointers */
	};



	function TESSmesh() {
		var v = new TESSvertex();
		var f = new TESSface();
		var e = new TESShalfEdge(0);
		var eSym = new TESShalfEdge(1);

		v.next = v.prev = v;
		v.anEdge = null;

		f.next = f.prev = f;
		f.anEdge = null;
		f.trail = null;
		f.marked = false;
		f.inside = false;

		e.next = e;
		e.Sym = eSym;
		e.Onext = null;
		e.Lnext = null;
		e.Org = null;
		e.Lface = null;
		e.winding = 0;
		e.activeRegion = null;

		eSym.next = eSym;
		eSym.Sym = e;
		eSym.Onext = null;
		eSym.Lnext = null;
		eSym.Org = null;
		eSym.Lface = null;
		eSym.winding = 0;
		eSym.activeRegion = null;

		this.vHead = v;		/* dummy header for vertex list */
		this.fHead = f;		/* dummy header for face list */
		this.eHead = e;		/* dummy header for edge list */
		this.eHeadSym = eSym;	/* and its symmetric counterpart */
	};

	/* The mesh operations below have three motivations: completeness,
	* convenience, and efficiency.  The basic mesh operations are MakeEdge,
	* Splice, and Delete.  All the other edge operations can be implemented
	* in terms of these.  The other operations are provided for convenience
	* and/or efficiency.
	*
	* When a face is split or a vertex is added, they are inserted into the
	* global list *before* the existing vertex or face (ie. e->Org or e->Lface).
	* This makes it easier to process all vertices or faces in the global lists
	* without worrying about processing the same data twice.  As a convenience,
	* when a face is split, the "inside" flag is copied from the old face.
	* Other internal data (v->data, v->activeRegion, f->data, f->marked,
	* f->trail, e->winding) is set to zero.
	*
	* ********************** Basic Edge Operations **************************
	*
	* tessMeshMakeEdge( mesh ) creates one edge, two vertices, and a loop.
	* The loop (face) consists of the two new half-edges.
	*
	* tessMeshSplice( eOrg, eDst ) is the basic operation for changing the
	* mesh connectivity and topology.  It changes the mesh so that
	*  eOrg->Onext <- OLD( eDst->Onext )
	*  eDst->Onext <- OLD( eOrg->Onext )
	* where OLD(...) means the value before the meshSplice operation.
	*
	* This can have two effects on the vertex structure:
	*  - if eOrg->Org != eDst->Org, the two vertices are merged together
	*  - if eOrg->Org == eDst->Org, the origin is split into two vertices
	* In both cases, eDst->Org is changed and eOrg->Org is untouched.
	*
	* Similarly (and independently) for the face structure,
	*  - if eOrg->Lface == eDst->Lface, one loop is split into two
	*  - if eOrg->Lface != eDst->Lface, two distinct loops are joined into one
	* In both cases, eDst->Lface is changed and eOrg->Lface is unaffected.
	*
	* tessMeshDelete( eDel ) removes the edge eDel.  There are several cases:
	* if (eDel->Lface != eDel->Rface), we join two loops into one; the loop
	* eDel->Lface is deleted.  Otherwise, we are splitting one loop into two;
	* the newly created loop will contain eDel->Dst.  If the deletion of eDel
	* would create isolated vertices, those are deleted as well.
	*
	* ********************** Other Edge Operations **************************
	*
	* tessMeshAddEdgeVertex( eOrg ) creates a new edge eNew such that
	* eNew == eOrg->Lnext, and eNew->Dst is a newly created vertex.
	* eOrg and eNew will have the same left face.
	*
	* tessMeshSplitEdge( eOrg ) splits eOrg into two edges eOrg and eNew,
	* such that eNew == eOrg->Lnext.  The new vertex is eOrg->Dst == eNew->Org.
	* eOrg and eNew will have the same left face.
	*
	* tessMeshConnect( eOrg, eDst ) creates a new edge from eOrg->Dst
	* to eDst->Org, and returns the corresponding half-edge eNew.
	* If eOrg->Lface == eDst->Lface, this splits one loop into two,
	* and the newly created loop is eNew->Lface.  Otherwise, two disjoint
	* loops are merged into one, and the loop eDst->Lface is destroyed.
	*
	* ************************ Other Operations *****************************
	*
	* tessMeshNewMesh() creates a new mesh with no edges, no vertices,
	* and no loops (what we usually call a "face").
	*
	* tessMeshUnion( mesh1, mesh2 ) forms the union of all structures in
	* both meshes, and returns the new mesh (the old meshes are destroyed).
	*
	* tessMeshDeleteMesh( mesh ) will free all storage for any valid mesh.
	*
	* tessMeshZapFace( fZap ) destroys a face and removes it from the
	* global face list.  All edges of fZap will have a NULL pointer as their
	* left face.  Any edges which also have a NULL pointer as their right face
	* are deleted entirely (along with any isolated vertices this produces).
	* An entire mesh can be deleted by zapping its faces, one at a time,
	* in any order.  Zapped faces cannot be used in further mesh operations!
	*
	* tessMeshCheckMesh( mesh ) checks a mesh for self-consistency.
	*/

	TESSmesh.prototype = {

		/* MakeEdge creates a new pair of half-edges which form their own loop.
		* No vertex or face structures are allocated, but these must be assigned
		* before the current edge operation is completed.
		*/
		//static TESShalfEdge *MakeEdge( TESSmesh* mesh, TESShalfEdge *eNext )
		makeEdge_: function(eNext) {
			var e = new TESShalfEdge(0);
			var eSym = new TESShalfEdge(1);

			/* Make sure eNext points to the first edge of the edge pair */
			if( eNext.Sym.side < eNext.side ) { eNext = eNext.Sym; }

			/* Insert in circular doubly-linked list before eNext.
			* Note that the prev pointer is stored in Sym->next.
			*/
			var ePrev = eNext.Sym.next;
			eSym.next = ePrev;
			ePrev.Sym.next = e;
			e.next = eNext;
			eNext.Sym.next = eSym;

			e.Sym = eSym;
			e.Onext = e;
			e.Lnext = eSym;
			e.Org = null;
			e.Lface = null;
			e.winding = 0;
			e.activeRegion = null;

			eSym.Sym = e;
			eSym.Onext = eSym;
			eSym.Lnext = e;
			eSym.Org = null;
			eSym.Lface = null;
			eSym.winding = 0;
			eSym.activeRegion = null;

			return e;
		},

		/* Splice( a, b ) is best described by the Guibas/Stolfi paper or the
		* CS348a notes (see mesh.h).  Basically it modifies the mesh so that
		* a->Onext and b->Onext are exchanged.  This can have various effects
		* depending on whether a and b belong to different face or vertex rings.
		* For more explanation see tessMeshSplice() below.
		*/
		// static void Splice( TESShalfEdge *a, TESShalfEdge *b )
		splice_: function(a, b) {
			var aOnext = a.Onext;
			var bOnext = b.Onext;
			aOnext.Sym.Lnext = b;
			bOnext.Sym.Lnext = a;
			a.Onext = bOnext;
			b.Onext = aOnext;
		},

		/* MakeVertex( newVertex, eOrig, vNext ) attaches a new vertex and makes it the
		* origin of all edges in the vertex loop to which eOrig belongs. "vNext" gives
		* a place to insert the new vertex in the global vertex list.  We insert
		* the new vertex *before* vNext so that algorithms which walk the vertex
		* list will not see the newly created vertices.
		*/
		//static void MakeVertex( TESSvertex *newVertex, TESShalfEdge *eOrig, TESSvertex *vNext )
		makeVertex_: function(newVertex, eOrig, vNext) {
			var vNew = newVertex;
			assert(vNew !== null);

			/* insert in circular doubly-linked list before vNext */
			var vPrev = vNext.prev;
			vNew.prev = vPrev;
			vPrev.next = vNew;
			vNew.next = vNext;
			vNext.prev = vNew;

			vNew.anEdge = eOrig;
			/* leave coords, s, t undefined */

			/* fix other edges on this vertex loop */
			var e = eOrig;
			do {
				e.Org = vNew;
				e = e.Onext;
			} while(e !== eOrig);
		},

		/* MakeFace( newFace, eOrig, fNext ) attaches a new face and makes it the left
		* face of all edges in the face loop to which eOrig belongs.  "fNext" gives
		* a place to insert the new face in the global face list.  We insert
		* the new face *before* fNext so that algorithms which walk the face
		* list will not see the newly created faces.
		*/
		// static void MakeFace( TESSface *newFace, TESShalfEdge *eOrig, TESSface *fNext )
		makeFace_: function(newFace, eOrig, fNext) {
			var fNew = newFace;
			assert(fNew !== null); 

			/* insert in circular doubly-linked list before fNext */
			var fPrev = fNext.prev;
			fNew.prev = fPrev;
			fPrev.next = fNew;
			fNew.next = fNext;
			fNext.prev = fNew;

			fNew.anEdge = eOrig;
			fNew.trail = null;
			fNew.marked = false;

			/* The new face is marked "inside" if the old one was.  This is a
			* convenience for the common case where a face has been split in two.
			*/
			fNew.inside = fNext.inside;

			/* fix other edges on this face loop */
			var e = eOrig;
			do {
				e.Lface = fNew;
				e = e.Lnext;
			} while(e !== eOrig);
		},

		/* KillEdge( eDel ) destroys an edge (the half-edges eDel and eDel->Sym),
		* and removes from the global edge list.
		*/
		//static void KillEdge( TESSmesh *mesh, TESShalfEdge *eDel )
		killEdge_: function(eDel) {
			/* Half-edges are allocated in pairs, see EdgePair above */
			if( eDel.Sym.side < eDel.side ) { eDel = eDel.Sym; }

			/* delete from circular doubly-linked list */
			var eNext = eDel.next;
			var ePrev = eDel.Sym.next;
			eNext.Sym.next = ePrev;
			ePrev.Sym.next = eNext;
		},


		/* KillVertex( vDel ) destroys a vertex and removes it from the global
		* vertex list.  It updates the vertex loop to point to a given new vertex.
		*/
		//static void KillVertex( TESSmesh *mesh, TESSvertex *vDel, TESSvertex *newOrg )
		killVertex_: function(vDel, newOrg) {
			var eStart = vDel.anEdge;
			/* change the origin of all affected edges */
			var e = eStart;
			do {
				e.Org = newOrg;
				e = e.Onext;
			} while(e !== eStart);

			/* delete from circular doubly-linked list */
			var vPrev = vDel.prev;
			var vNext = vDel.next;
			vNext.prev = vPrev;
			vPrev.next = vNext;
		},

		/* KillFace( fDel ) destroys a face and removes it from the global face
		* list.  It updates the face loop to point to a given new face.
		*/
		//static void KillFace( TESSmesh *mesh, TESSface *fDel, TESSface *newLface )
		killFace_: function(fDel, newLface) {
			var eStart = fDel.anEdge;

			/* change the left face of all affected edges */
			var e = eStart;
			do {
				e.Lface = newLface;
				e = e.Lnext;
			} while(e !== eStart);

			/* delete from circular doubly-linked list */
			var fPrev = fDel.prev;
			var fNext = fDel.next;
			fNext.prev = fPrev;
			fPrev.next = fNext;
		},

		/****************** Basic Edge Operations **********************/

		/* tessMeshMakeEdge creates one edge, two vertices, and a loop (face).
		* The loop consists of the two new half-edges.
		*/
		//TESShalfEdge *tessMeshMakeEdge( TESSmesh *mesh )
		makeEdge: function() {
			var newVertex1 = new TESSvertex();
			var newVertex2 = new TESSvertex();
			var newFace = new TESSface();
			var e = this.makeEdge_( this.eHead);
			this.makeVertex_( newVertex1, e, this.vHead );
			this.makeVertex_( newVertex2, e.Sym, this.vHead );
			this.makeFace_( newFace, e, this.fHead );
			return e;
		},

		/* tessMeshSplice( eOrg, eDst ) is the basic operation for changing the
		* mesh connectivity and topology.  It changes the mesh so that
		*	eOrg->Onext <- OLD( eDst->Onext )
		*	eDst->Onext <- OLD( eOrg->Onext )
		* where OLD(...) means the value before the meshSplice operation.
		*
		* This can have two effects on the vertex structure:
		*  - if eOrg->Org != eDst->Org, the two vertices are merged together
		*  - if eOrg->Org == eDst->Org, the origin is split into two vertices
		* In both cases, eDst->Org is changed and eOrg->Org is untouched.
		*
		* Similarly (and independently) for the face structure,
		*  - if eOrg->Lface == eDst->Lface, one loop is split into two
		*  - if eOrg->Lface != eDst->Lface, two distinct loops are joined into one
		* In both cases, eDst->Lface is changed and eOrg->Lface is unaffected.
		*
		* Some special cases:
		* If eDst == eOrg, the operation has no effect.
		* If eDst == eOrg->Lnext, the new face will have a single edge.
		* If eDst == eOrg->Lprev, the old face will have a single edge.
		* If eDst == eOrg->Onext, the new vertex will have a single edge.
		* If eDst == eOrg->Oprev, the old vertex will have a single edge.
		*/
		//int tessMeshSplice( TESSmesh* mesh, TESShalfEdge *eOrg, TESShalfEdge *eDst )
		splice: function(eOrg, eDst) {
			var joiningLoops = false;
			var joiningVertices = false;

			if( eOrg === eDst ) return;

			if( eDst.Org !== eOrg.Org ) {
				/* We are merging two disjoint vertices -- destroy eDst->Org */
				joiningVertices = true;
				this.killVertex_( eDst.Org, eOrg.Org );
			}
			if( eDst.Lface !== eOrg.Lface ) {
				/* We are connecting two disjoint loops -- destroy eDst->Lface */
				joiningLoops = true;
				this.killFace_( eDst.Lface, eOrg.Lface );
			}

			/* Change the edge structure */
			this.splice_( eDst, eOrg );

			if( ! joiningVertices ) {
				var newVertex = new TESSvertex();

				/* We split one vertex into two -- the new vertex is eDst->Org.
				* Make sure the old vertex points to a valid half-edge.
				*/
				this.makeVertex_( newVertex, eDst, eOrg.Org );
				eOrg.Org.anEdge = eOrg;
			}
			if( ! joiningLoops ) {
				var newFace = new TESSface();  

				/* We split one loop into two -- the new loop is eDst->Lface.
				* Make sure the old face points to a valid half-edge.
				*/
				this.makeFace_( newFace, eDst, eOrg.Lface );
				eOrg.Lface.anEdge = eOrg;
			}
		},

		/* tessMeshDelete( eDel ) removes the edge eDel.  There are several cases:
		* if (eDel->Lface != eDel->Rface), we join two loops into one; the loop
		* eDel->Lface is deleted.  Otherwise, we are splitting one loop into two;
		* the newly created loop will contain eDel->Dst.  If the deletion of eDel
		* would create isolated vertices, those are deleted as well.
		*
		* This function could be implemented as two calls to tessMeshSplice
		* plus a few calls to memFree, but this would allocate and delete
		* unnecessary vertices and faces.
		*/
		//int tessMeshDelete( TESSmesh *mesh, TESShalfEdge *eDel )
		delete: function(eDel) {
			var eDelSym = eDel.Sym;
			var joiningLoops = false;

			/* First step: disconnect the origin vertex eDel->Org.  We make all
			* changes to get a consistent mesh in this "intermediate" state.
			*/
			if( eDel.Lface !== eDel.Rface ) {
				/* We are joining two loops into one -- remove the left face */
				joiningLoops = true;
				this.killFace_( eDel.Lface, eDel.Rface );
			}

			if( eDel.Onext === eDel ) {
				this.killVertex_( eDel.Org, null );
			} else {
				/* Make sure that eDel->Org and eDel->Rface point to valid half-edges */
				eDel.Rface.anEdge = eDel.Oprev;
				eDel.Org.anEdge = eDel.Onext;

				this.splice_( eDel, eDel.Oprev );
				if( ! joiningLoops ) {
					var newFace = new TESSface();

					/* We are splitting one loop into two -- create a new loop for eDel. */
					this.makeFace_( newFace, eDel, eDel.Lface );
				}
			}

			/* Claim: the mesh is now in a consistent state, except that eDel->Org
			* may have been deleted.  Now we disconnect eDel->Dst.
			*/
			if( eDelSym.Onext === eDelSym ) {
				this.killVertex_( eDelSym.Org, null );
				this.killFace_( eDelSym.Lface, null );
			} else {
				/* Make sure that eDel->Dst and eDel->Lface point to valid half-edges */
				eDel.Lface.anEdge = eDelSym.Oprev;
				eDelSym.Org.anEdge = eDelSym.Onext;
				this.splice_( eDelSym, eDelSym.Oprev );
			}

			/* Any isolated vertices or faces have already been freed. */
			this.killEdge_( eDel );
		},

		/******************** Other Edge Operations **********************/

		/* All these routines can be implemented with the basic edge
		* operations above.  They are provided for convenience and efficiency.
		*/


		/* tessMeshAddEdgeVertex( eOrg ) creates a new edge eNew such that
		* eNew == eOrg->Lnext, and eNew->Dst is a newly created vertex.
		* eOrg and eNew will have the same left face.
		*/
		// TESShalfEdge *tessMeshAddEdgeVertex( TESSmesh *mesh, TESShalfEdge *eOrg );
		addEdgeVertex: function(eOrg) {
			var eNew = this.makeEdge_( eOrg );
			var eNewSym = eNew.Sym;

			/* Connect the new edge appropriately */
			this.splice_( eNew, eOrg.Lnext );

			/* Set the vertex and face information */
			eNew.Org = eOrg.Dst;

			var newVertex = new TESSvertex();
			this.makeVertex_( newVertex, eNewSym, eNew.Org );

			eNew.Lface = eNewSym.Lface = eOrg.Lface;

			return eNew;
		},


		/* tessMeshSplitEdge( eOrg ) splits eOrg into two edges eOrg and eNew,
		* such that eNew == eOrg->Lnext.  The new vertex is eOrg->Dst == eNew->Org.
		* eOrg and eNew will have the same left face.
		*/
		// TESShalfEdge *tessMeshSplitEdge( TESSmesh *mesh, TESShalfEdge *eOrg );
		splitEdge: function(eOrg, eDst) {
			var tempHalfEdge = this.addEdgeVertex( eOrg );
			var eNew = tempHalfEdge.Sym;

			/* Disconnect eOrg from eOrg->Dst and connect it to eNew->Org */
			this.splice_( eOrg.Sym, eOrg.Sym.Oprev );
			this.splice_( eOrg.Sym, eNew );

			/* Set the vertex and face information */
			eOrg.Dst = eNew.Org;
			eNew.Dst.anEdge = eNew.Sym;	/* may have pointed to eOrg->Sym */
			eNew.Rface = eOrg.Rface;
			eNew.winding = eOrg.winding;	/* copy old winding information */
			eNew.Sym.winding = eOrg.Sym.winding;

			return eNew;
		},


		/* tessMeshConnect( eOrg, eDst ) creates a new edge from eOrg->Dst
		* to eDst->Org, and returns the corresponding half-edge eNew.
		* If eOrg->Lface == eDst->Lface, this splits one loop into two,
		* and the newly created loop is eNew->Lface.  Otherwise, two disjoint
		* loops are merged into one, and the loop eDst->Lface is destroyed.
		*
		* If (eOrg == eDst), the new face will have only two edges.
		* If (eOrg->Lnext == eDst), the old face is reduced to a single edge.
		* If (eOrg->Lnext->Lnext == eDst), the old face is reduced to two edges.
		*/

		// TESShalfEdge *tessMeshConnect( TESSmesh *mesh, TESShalfEdge *eOrg, TESShalfEdge *eDst );
		connect: function(eOrg, eDst) {
			var joiningLoops = false;  
			var eNew = this.makeEdge_( eOrg );
			var eNewSym = eNew.Sym;

			if( eDst.Lface !== eOrg.Lface ) {
				/* We are connecting two disjoint loops -- destroy eDst->Lface */
				joiningLoops = true;
				this.killFace_( eDst.Lface, eOrg.Lface );
			}

			/* Connect the new edge appropriately */
			this.splice_( eNew, eOrg.Lnext );
			this.splice_( eNewSym, eDst );

			/* Set the vertex and face information */
			eNew.Org = eOrg.Dst;
			eNewSym.Org = eDst.Org;
			eNew.Lface = eNewSym.Lface = eOrg.Lface;

			/* Make sure the old face points to a valid half-edge */
			eOrg.Lface.anEdge = eNewSym;

			if( ! joiningLoops ) {
				var newFace = new TESSface();
				/* We split one loop into two -- the new loop is eNew->Lface */
				this.makeFace_( newFace, eNew, eOrg.Lface );
			}
			return eNew;
		},

		/* tessMeshZapFace( fZap ) destroys a face and removes it from the
		* global face list.  All edges of fZap will have a NULL pointer as their
		* left face.  Any edges which also have a NULL pointer as their right face
		* are deleted entirely (along with any isolated vertices this produces).
		* An entire mesh can be deleted by zapping its faces, one at a time,
		* in any order.  Zapped faces cannot be used in further mesh operations!
		*/
		zapFace: function( fZap )
		{
			var eStart = fZap.anEdge;
			var e, eNext, eSym;
			var fPrev, fNext;

			/* walk around face, deleting edges whose right face is also NULL */
			eNext = eStart.Lnext;
			do {
				e = eNext;
				eNext = e.Lnext;

				e.Lface = null;
				if( e.Rface === null ) {
					/* delete the edge -- see TESSmeshDelete above */

					if( e.Onext === e ) {
						this.killVertex_( e.Org, null );
					} else {
						/* Make sure that e->Org points to a valid half-edge */
						e.Org.anEdge = e.Onext;
						this.splice_( e, e.Oprev );
					}
					eSym = e.Sym;
					if( eSym.Onext === eSym ) {
						this.killVertex_( eSym.Org, null );
					} else {
						/* Make sure that eSym->Org points to a valid half-edge */
						eSym.Org.anEdge = eSym.Onext;
						this.splice_( eSym, eSym.Oprev );
					}
					this.killEdge_( e );
				}
			} while( e != eStart );

			/* delete from circular doubly-linked list */
			fPrev = fZap.prev;
			fNext = fZap.next;
			fNext.prev = fPrev;
			fPrev.next = fNext;
		},

		countFaceVerts_: function(f) {
			var eCur = f.anEdge;
			var n = 0;
			do
			{
				n++;
				eCur = eCur.Lnext;
			}
			while (eCur !== f.anEdge);
			return n;
		},

		//int tessMeshMergeConvexFaces( TESSmesh *mesh, int maxVertsPerFace )
		mergeConvexFaces: function(maxVertsPerFace) {
			var f;
			var eCur, eNext, eSym;
			var vStart;
			var curNv, symNv;

			for( f = this.fHead.next; f !== this.fHead; f = f.next )
			{
				// Skip faces which are outside the result.
				if( !f.inside )
					continue;

				eCur = f.anEdge;
				vStart = eCur.Org;
					
				while (true)
				{
					eNext = eCur.Lnext;
					eSym = eCur.Sym;

					// Try to merge if the neighbour face is valid.
					if( eSym && eSym.Lface && eSym.Lface.inside )
					{
						// Try to merge the neighbour faces if the resulting polygons
						// does not exceed maximum number of vertices.
						curNv = this.countFaceVerts_( f );
						symNv = this.countFaceVerts_( eSym.Lface );
						if( (curNv+symNv-2) <= maxVertsPerFace )
						{
							// Merge if the resulting poly is convex.
							if( Geom.vertCCW( eCur.Lprev.Org, eCur.Org, eSym.Lnext.Lnext.Org ) &&
								Geom.vertCCW( eSym.Lprev.Org, eSym.Org, eCur.Lnext.Lnext.Org ) )
							{
								eNext = eSym.Lnext;
								this.delete( eSym );
								eCur = null;
								eSym = null;
							}
						}
					}
					
					if( eCur && eCur.Lnext.Org === vStart )
						break;
						
					// Continue to next edge.
					eCur = eNext;
				}
			}
			
			return true;
		},

		/* tessMeshCheckMesh( mesh ) checks a mesh for self-consistency.
		*/
		check: function() {
			var fHead = this.fHead;
			var vHead = this.vHead;
			var eHead = this.eHead;
			var f, fPrev, v, vPrev, e, ePrev;

			fPrev = fHead;
			for( fPrev = fHead ; (f = fPrev.next) !== fHead; fPrev = f) {
				assert( f.prev === fPrev );
				e = f.anEdge;
				do {
					assert( e.Sym !== e );
					assert( e.Sym.Sym === e );
					assert( e.Lnext.Onext.Sym === e );
					assert( e.Onext.Sym.Lnext === e );
					assert( e.Lface === f );
					e = e.Lnext;
				} while( e !== f.anEdge );
			}
			assert( f.prev === fPrev && f.anEdge === null );

			vPrev = vHead;
			for( vPrev = vHead ; (v = vPrev.next) !== vHead; vPrev = v) {
				assert( v.prev === vPrev );
				e = v.anEdge;
				do {
					assert( e.Sym !== e );
					assert( e.Sym.Sym === e );
					assert( e.Lnext.Onext.Sym === e );
					assert( e.Onext.Sym.Lnext === e );
					assert( e.Org === v );
					e = e.Onext;
				} while( e !== v.anEdge );
			}
			assert( v.prev === vPrev && v.anEdge === null );

			ePrev = eHead;
			for( ePrev = eHead ; (e = ePrev.next) !== eHead; ePrev = e) {
				assert( e.Sym.next === ePrev.Sym );
				assert( e.Sym !== e );
				assert( e.Sym.Sym === e );
				assert( e.Org !== null );
				assert( e.Dst !== null );
				assert( e.Lnext.Onext.Sym === e );
				assert( e.Onext.Sym.Lnext === e );
			}
			assert( e.Sym.next === ePrev.Sym
				&& e.Sym === this.eHeadSym
				&& e.Sym.Sym === e
				&& e.Org === null && e.Dst === null
				&& e.Lface === null && e.Rface === null );
		}

	};

	var Geom = {};

	Geom.vertEq = function(u,v) {
		return (u.s === v.s && u.t === v.t);
	};

	/* Returns TRUE if u is lexicographically <= v. */
	Geom.vertLeq = function(u,v) {
		return ((u.s < v.s) || (u.s === v.s && u.t <= v.t));
	};

	/* Versions of VertLeq, EdgeSign, EdgeEval with s and t transposed. */
	Geom.transLeq = function(u,v) {
		return ((u.t < v.t) || (u.t === v.t && u.s <= v.s));
	};

	Geom.edgeGoesLeft = function(e) {
		return Geom.vertLeq( e.Dst, e.Org );
	};

	Geom.edgeGoesRight = function(e) {
		return Geom.vertLeq( e.Org, e.Dst );
	};

	Geom.vertL1dist = function(u,v) {
		return (Math.abs(u.s - v.s) + Math.abs(u.t - v.t));
	};

	//TESSreal tesedgeEval( TESSvertex *u, TESSvertex *v, TESSvertex *w )
	Geom.edgeEval = function( u, v, w ) {
		/* Given three vertices u,v,w such that VertLeq(u,v) && VertLeq(v,w),
		* evaluates the t-coord of the edge uw at the s-coord of the vertex v.
		* Returns v->t - (uw)(v->s), ie. the signed distance from uw to v.
		* If uw is vertical (and thus passes thru v), the result is zero.
		*
		* The calculation is extremely accurate and stable, even when v
		* is very close to u or w.  In particular if we set v->t = 0 and
		* let r be the negated result (this evaluates (uw)(v->s)), then
		* r is guaranteed to satisfy MIN(u->t,w->t) <= r <= MAX(u->t,w->t).
		*/
		assert( Geom.vertLeq( u, v ) && Geom.vertLeq( v, w ));

		var gapL = v.s - u.s;
		var gapR = w.s - v.s;

		if( gapL + gapR > 0.0 ) {
			if( gapL < gapR ) {
				return (v.t - u.t) + (u.t - w.t) * (gapL / (gapL + gapR));
			} else {
				return (v.t - w.t) + (w.t - u.t) * (gapR / (gapL + gapR));
			}
		}
		/* vertical line */
		return 0.0;
	};

	//TESSreal tesedgeSign( TESSvertex *u, TESSvertex *v, TESSvertex *w )
	Geom.edgeSign = function( u, v, w ) {
		/* Returns a number whose sign matches EdgeEval(u,v,w) but which
		* is cheaper to evaluate.  Returns > 0, == 0 , or < 0
		* as v is above, on, or below the edge uw.
		*/
		assert( Geom.vertLeq( u, v ) && Geom.vertLeq( v, w ));

		var gapL = v.s - u.s;
		var gapR = w.s - v.s;

		if( gapL + gapR > 0.0 ) {
			return (v.t - w.t) * gapL + (v.t - u.t) * gapR;
		}
		/* vertical line */
		return 0.0;
	};


	/***********************************************************************
	* Define versions of EdgeSign, EdgeEval with s and t transposed.
	*/

	//TESSreal testransEval( TESSvertex *u, TESSvertex *v, TESSvertex *w )
	Geom.transEval = function( u, v, w ) {
		/* Given three vertices u,v,w such that TransLeq(u,v) && TransLeq(v,w),
		* evaluates the t-coord of the edge uw at the s-coord of the vertex v.
		* Returns v->s - (uw)(v->t), ie. the signed distance from uw to v.
		* If uw is vertical (and thus passes thru v), the result is zero.
		*
		* The calculation is extremely accurate and stable, even when v
		* is very close to u or w.  In particular if we set v->s = 0 and
		* let r be the negated result (this evaluates (uw)(v->t)), then
		* r is guaranteed to satisfy MIN(u->s,w->s) <= r <= MAX(u->s,w->s).
		*/
		assert( Geom.transLeq( u, v ) && Geom.transLeq( v, w ));

		var gapL = v.t - u.t;
		var gapR = w.t - v.t;

		if( gapL + gapR > 0.0 ) {
			if( gapL < gapR ) {
				return (v.s - u.s) + (u.s - w.s) * (gapL / (gapL + gapR));
			} else {
				return (v.s - w.s) + (w.s - u.s) * (gapR / (gapL + gapR));
			}
		}
		/* vertical line */
		return 0.0;
	};

	//TESSreal testransSign( TESSvertex *u, TESSvertex *v, TESSvertex *w )
	Geom.transSign = function( u, v, w ) {
		/* Returns a number whose sign matches TransEval(u,v,w) but which
		* is cheaper to evaluate.  Returns > 0, == 0 , or < 0
		* as v is above, on, or below the edge uw.
		*/
		assert( Geom.transLeq( u, v ) && Geom.transLeq( v, w ));

		var gapL = v.t - u.t;
		var gapR = w.t - v.t;

		if( gapL + gapR > 0.0 ) {
			return (v.s - w.s) * gapL + (v.s - u.s) * gapR;
		}
		/* vertical line */
		return 0.0;
	};


	//int tesvertCCW( TESSvertex *u, TESSvertex *v, TESSvertex *w )
	Geom.vertCCW = function( u, v, w ) {
		/* For almost-degenerate situations, the results are not reliable.
		* Unless the floating-point arithmetic can be performed without
		* rounding errors, *any* implementation will give incorrect results
		* on some degenerate inputs, so the client must have some way to
		* handle this situation.
		*/
		return (u.s*(v.t - w.t) + v.s*(w.t - u.t) + w.s*(u.t - v.t)) >= 0.0;
	};

	/* Given parameters a,x,b,y returns the value (b*x+a*y)/(a+b),
	* or (x+y)/2 if a==b==0.  It requires that a,b >= 0, and enforces
	* this in the rare case that one argument is slightly negative.
	* The implementation is extremely stable numerically.
	* In particular it guarantees that the result r satisfies
	* MIN(x,y) <= r <= MAX(x,y), and the results are very accurate
	* even when a and b differ greatly in magnitude.
	*/
	Geom.interpolate = function(a,x,b,y) {
		return (a = (a < 0) ? 0 : a, b = (b < 0) ? 0 : b, ((a <= b) ? ((b == 0) ? ((x+y) / 2) : (x + (y-x) * (a/(a+b)))) : (y + (x-y) * (b/(a+b)))));
	};

	/*
	#ifndef FOR_TRITE_TEST_PROGRAM
	#define Interpolate(a,x,b,y)	RealInterpolate(a,x,b,y)
	#else

	// Claim: the ONLY property the sweep algorithm relies on is that
	// MIN(x,y) <= r <= MAX(x,y).  This is a nasty way to test that.
	#include <stdlib.h>
	extern int RandomInterpolate;

	double Interpolate( double a, double x, double b, double y)
	{
		printf("*********************%d\n",RandomInterpolate);
		if( RandomInterpolate ) {
			a = 1.2 * drand48() - 0.1;
			a = (a < 0) ? 0 : ((a > 1) ? 1 : a);
			b = 1.0 - a;
		}
		return RealInterpolate(a,x,b,y);
	}
	#endif*/

	Geom.intersect = function( o1, d1, o2, d2, v ) {
		/* Given edges (o1,d1) and (o2,d2), compute their point of intersection.
		* The computed point is guaranteed to lie in the intersection of the
		* bounding rectangles defined by each edge.
		*/
		var z1, z2;
		var t;

		/* This is certainly not the most efficient way to find the intersection
		* of two line segments, but it is very numerically stable.
		*
		* Strategy: find the two middle vertices in the VertLeq ordering,
		* and interpolate the intersection s-value from these.  Then repeat
		* using the TransLeq ordering to find the intersection t-value.
		*/

		if( ! Geom.vertLeq( o1, d1 )) { t = o1; o1 = d1; d1 = t; } //swap( o1, d1 ); }
		if( ! Geom.vertLeq( o2, d2 )) { t = o2; o2 = d2; d2 = t; } //swap( o2, d2 ); }
		if( ! Geom.vertLeq( o1, o2 )) { t = o1; o1 = o2; o2 = t; t = d1; d1 = d2; d2 = t; }//swap( o1, o2 ); swap( d1, d2 ); }

		if( ! Geom.vertLeq( o2, d1 )) {
			/* Technically, no intersection -- do our best */
			v.s = (o2.s + d1.s) / 2;
		} else if( Geom.vertLeq( d1, d2 )) {
			/* Interpolate between o2 and d1 */
			z1 = Geom.edgeEval( o1, o2, d1 );
			z2 = Geom.edgeEval( o2, d1, d2 );
			if( z1+z2 < 0 ) { z1 = -z1; z2 = -z2; }
			v.s = Geom.interpolate( z1, o2.s, z2, d1.s );
		} else {
			/* Interpolate between o2 and d2 */
			z1 = Geom.edgeSign( o1, o2, d1 );
			z2 = -Geom.edgeSign( o1, d2, d1 );
			if( z1+z2 < 0 ) { z1 = -z1; z2 = -z2; }
			v.s = Geom.interpolate( z1, o2.s, z2, d2.s );
		}

		/* Now repeat the process for t */

		if( ! Geom.transLeq( o1, d1 )) { t = o1; o1 = d1; d1 = t; } //swap( o1, d1 ); }
		if( ! Geom.transLeq( o2, d2 )) { t = o2; o2 = d2; d2 = t; } //swap( o2, d2 ); }
		if( ! Geom.transLeq( o1, o2 )) { t = o1; o1 = o2; o2 = t; t = d1; d1 = d2; d2 = t; } //swap( o1, o2 ); swap( d1, d2 ); }

		if( ! Geom.transLeq( o2, d1 )) {
			/* Technically, no intersection -- do our best */
			v.t = (o2.t + d1.t) / 2;
		} else if( Geom.transLeq( d1, d2 )) {
			/* Interpolate between o2 and d1 */
			z1 = Geom.transEval( o1, o2, d1 );
			z2 = Geom.transEval( o2, d1, d2 );
			if( z1+z2 < 0 ) { z1 = -z1; z2 = -z2; }
			v.t = Geom.interpolate( z1, o2.t, z2, d1.t );
		} else {
			/* Interpolate between o2 and d2 */
			z1 = Geom.transSign( o1, o2, d1 );
			z2 = -Geom.transSign( o1, d2, d1 );
			if( z1+z2 < 0 ) { z1 = -z1; z2 = -z2; }
			v.t = Geom.interpolate( z1, o2.t, z2, d2.t );
		}
	};



	function DictNode() {
		this.key = null;
		this.next = null;
		this.prev = null;
	};

	function Dict(frame, leq) {
		this.head = new DictNode();
		this.head.next = this.head;
		this.head.prev = this.head;
		this.frame = frame;
		this.leq = leq;
	};

	Dict.prototype = {
		min: function() {
			return this.head.next;
		},

		max: function() {
			return this.head.prev;
		},

		insert: function(k) {
			return this.insertBefore(this.head, k);
		},

		search: function(key) {
			/* Search returns the node with the smallest key greater than or equal
			* to the given key.  If there is no such key, returns a node whose
			* key is NULL.  Similarly, Succ(Max(d)) has a NULL key, etc.
			*/
			var node = this.head;
			do {
				node = node.next;
			} while( node.key !== null && ! this.leq(this.frame, key, node.key));

			return node;
		},

		insertBefore: function(node, key) {
			do {
				node = node.prev;
			} while( node.key !== null && ! this.leq(this.frame, node.key, key));

			var newNode = new DictNode();
			newNode.key = key;
			newNode.next = node.next;
			node.next.prev = newNode;
			newNode.prev = node;
			node.next = newNode;

			return newNode;
		},

		delete: function(node) {
			node.next.prev = node.prev;
			node.prev.next = node.next;
		}
	};


	function PQnode() {
		this.handle = null;
	}

	function PQhandleElem() {
		this.key = null;
		this.node = null;
	}

	function PriorityQ(size, leq) {
		this.size = 0;
		this.max = size;

		this.nodes = [];
		this.nodes.length = size+1;
		for (var i = 0; i < this.nodes.length; i++)
			this.nodes[i] = new PQnode();

		this.handles = [];
		this.handles.length = size+1;
		for (var i = 0; i < this.handles.length; i++)
			this.handles[i] = new PQhandleElem();

		this.initialized = false;
		this.freeList = 0;
		this.leq = leq;

		this.nodes[1].handle = 1;	/* so that Minimum() returns NULL */
		this.handles[1].key = null;
	};

	PriorityQ.prototype = {

		floatDown_: function( curr )
		{
			var n = this.nodes;
			var h = this.handles;
			var hCurr, hChild;
			var child;

			hCurr = n[curr].handle;
			for( ;; ) {
				child = curr << 1;
				if( child < this.size && this.leq( h[n[child+1].handle].key, h[n[child].handle].key )) {
					++child;
				}

				assert(child <= this.max);

				hChild = n[child].handle;
				if( child > this.size || this.leq( h[hCurr].key, h[hChild].key )) {
					n[curr].handle = hCurr;
					h[hCurr].node = curr;
					break;
				}
				n[curr].handle = hChild;
				h[hChild].node = curr;
				curr = child;
			}
		},

		floatUp_: function( curr )
		{
			var n = this.nodes;
			var h = this.handles;
			var hCurr, hParent;
			var parent;

			hCurr = n[curr].handle;
			for( ;; ) {
				parent = curr >> 1;
				hParent = n[parent].handle;
				if( parent == 0 || this.leq( h[hParent].key, h[hCurr].key )) {
					n[curr].handle = hCurr;
					h[hCurr].node = curr;
					break;
				}
				n[curr].handle = hParent;
				h[hParent].node = curr;
				curr = parent;
			}
		},

		init: function() {
			/* This method of building a heap is O(n), rather than O(n lg n). */
			for( var i = this.size; i >= 1; --i ) {
				this.floatDown_( i );
			}
			this.initialized = true;
		},

		min: function() {
			return this.handles[this.nodes[1].handle].key;
		},

		isEmpty: function() {
			this.size === 0;
		},

		/* really pqHeapInsert */
		/* returns INV_HANDLE iff out of memory */
		//PQhandle pqHeapInsert( TESSalloc* alloc, PriorityQHeap *pq, PQkey keyNew )
		insert: function(keyNew)
		{
			var curr;
			var free;

			curr = ++this.size;
			if( (curr*2) > this.max ) {
				this.max *= 2;
				var s;
				s = this.nodes.length;
				this.nodes.length = this.max+1;
				for (var i = s; i < this.nodes.length; i++)
					this.nodes[i] = new PQnode();

				s = this.handles.length;
				this.handles.length = this.max+1;
				for (var i = s; i < this.handles.length; i++)
					this.handles[i] = new PQhandleElem();
			}

			if( this.freeList === 0 ) {
				free = curr;
			} else {
				free = this.freeList;
				this.freeList = this.handles[free].node;
			}

			this.nodes[curr].handle = free;
			this.handles[free].node = curr;
			this.handles[free].key = keyNew;

			if( this.initialized ) {
				this.floatUp_( curr );
			}
			return free;
		},

		//PQkey pqHeapExtractMin( PriorityQHeap *pq )
		extractMin: function() {
			var n = this.nodes;
			var h = this.handles;
			var hMin = n[1].handle;
			var min = h[hMin].key;

			if( this.size > 0 ) {
				n[1].handle = n[this.size].handle;
				h[n[1].handle].node = 1;

				h[hMin].key = null;
				h[hMin].node = this.freeList;
				this.freeList = hMin;

				--this.size;
				if( this.size > 0 ) {
					this.floatDown_( 1 );
				}
			}
			return min;
		},

		delete: function( hCurr ) {
			var n = this.nodes;
			var h = this.handles;
			var curr;

			assert( hCurr >= 1 && hCurr <= this.max && h[hCurr].key !== null );

			curr = h[hCurr].node;
			n[curr].handle = n[this.size].handle;
			h[n[curr].handle].node = curr;

			--this.size;
			if( curr <= this.size ) {
				if( curr <= 1 || this.leq( h[n[curr>>1].handle].key, h[n[curr].handle].key )) {
					this.floatDown_( curr );
				} else {
					this.floatUp_( curr );
				}
			}
			h[hCurr].key = null;
			h[hCurr].node = this.freeList;
			this.freeList = hCurr;
		}
	};


	/* For each pair of adjacent edges crossing the sweep line, there is
	* an ActiveRegion to represent the region between them.  The active
	* regions are kept in sorted order in a dynamic dictionary.  As the
	* sweep line crosses each vertex, we update the affected regions.
	*/

	function ActiveRegion() {
		this.eUp = null;		/* upper edge, directed right to left */
		this.nodeUp = null;	/* dictionary node corresponding to eUp */
		this.windingNumber = 0;	/* used to determine which regions are
								* inside the polygon */
		this.inside = false;		/* is this region inside the polygon? */
		this.sentinel = false;	/* marks fake edges at t = +/-infinity */
		this.dirty = false;		/* marks regions where the upper or lower
						* edge has changed, but we haven't checked
						* whether they intersect yet */
		this.fixUpperEdge = false;	/* marks temporary edges introduced when
							* we process a "right vertex" (one without
							* any edges leaving to the right) */
	};

	var Sweep = {};

	Sweep.regionBelow = function(r) {
		return r.nodeUp.prev.key;
	}

	Sweep.regionAbove = function(r) {
		return r.nodeUp.next.key;
	}

	Sweep.debugEvent = function( tess ) {
		// empty
	}


	/*
	* Invariants for the Edge Dictionary.
	* - each pair of adjacent edges e2=Succ(e1) satisfies EdgeLeq(e1,e2)
	*   at any valid location of the sweep event
	* - if EdgeLeq(e2,e1) as well (at any valid sweep event), then e1 and e2
	*   share a common endpoint
	* - for each e, e->Dst has been processed, but not e->Org
	* - each edge e satisfies VertLeq(e->Dst,event) && VertLeq(event,e->Org)
	*   where "event" is the current sweep line event.
	* - no edge e has zero length
	*
	* Invariants for the Mesh (the processed portion).
	* - the portion of the mesh left of the sweep line is a planar graph,
	*   ie. there is *some* way to embed it in the plane
	* - no processed edge has zero length
	* - no two processed vertices have identical coordinates
	* - each "inside" region is monotone, ie. can be broken into two chains
	*   of monotonically increasing vertices according to VertLeq(v1,v2)
	*   - a non-invariant: these chains may intersect (very slightly)
	*
	* Invariants for the Sweep.
	* - if none of the edges incident to the event vertex have an activeRegion
	*   (ie. none of these edges are in the edge dictionary), then the vertex
	*   has only right-going edges.
	* - if an edge is marked "fixUpperEdge" (it is a temporary edge introduced
	*   by ConnectRightVertex), then it is the only right-going edge from
	*   its associated vertex.  (This says that these edges exist only
	*   when it is necessary.)
	*/

	/* When we merge two edges into one, we need to compute the combined
	* winding of the new edge.
	*/
	Sweep.addWinding = function(eDst,eSrc) {
		eDst.winding += eSrc.winding;
		eDst.Sym.winding += eSrc.Sym.winding;
	}


	//static int EdgeLeq( TESStesselator *tess, ActiveRegion *reg1, ActiveRegion *reg2 )
	Sweep.edgeLeq = function( tess, reg1, reg2 ) {
		/*
		* Both edges must be directed from right to left (this is the canonical
		* direction for the upper edge of each region).
		*
		* The strategy is to evaluate a "t" value for each edge at the
		* current sweep line position, given by tess->event.  The calculations
		* are designed to be very stable, but of course they are not perfect.
		*
		* Special case: if both edge destinations are at the sweep event,
		* we sort the edges by slope (they would otherwise compare equally).
		*/
		var ev = tess.event;
		var t1, t2;

		var e1 = reg1.eUp;
		var e2 = reg2.eUp;

		if( e1.Dst === ev ) {
			if( e2.Dst === ev ) {
				/* Two edges right of the sweep line which meet at the sweep event.
				* Sort them by slope.
				*/
				if( Geom.vertLeq( e1.Org, e2.Org )) {
					return Geom.edgeSign( e2.Dst, e1.Org, e2.Org ) <= 0;
				}
				return Geom.edgeSign( e1.Dst, e2.Org, e1.Org ) >= 0;
			}
			return Geom.edgeSign( e2.Dst, ev, e2.Org ) <= 0;
		}
		if( e2.Dst === ev ) {
			return Geom.edgeSign( e1.Dst, ev, e1.Org ) >= 0;
		}

		/* General case - compute signed distance *from* e1, e2 to event */
		var t1 = Geom.edgeEval( e1.Dst, ev, e1.Org );
		var t2 = Geom.edgeEval( e2.Dst, ev, e2.Org );
		return (t1 >= t2);
	}


	//static void DeleteRegion( TESStesselator *tess, ActiveRegion *reg )
	Sweep.deleteRegion = function( tess, reg ) {
		if( reg.fixUpperEdge ) {
			/* It was created with zero winding number, so it better be
			* deleted with zero winding number (ie. it better not get merged
			* with a real edge).
			*/
			assert( reg.eUp.winding === 0 );
		}
		reg.eUp.activeRegion = null;
		tess.dict.delete( reg.nodeUp );
	}

	//static int FixUpperEdge( TESStesselator *tess, ActiveRegion *reg, TESShalfEdge *newEdge )
	Sweep.fixUpperEdge = function( tess, reg, newEdge ) {
		/*
		* Replace an upper edge which needs fixing (see ConnectRightVertex).
		*/
		assert( reg.fixUpperEdge );
		tess.mesh.delete( reg.eUp );
		reg.fixUpperEdge = false;
		reg.eUp = newEdge;
		newEdge.activeRegion = reg;
	}

	//static ActiveRegion *TopLeftRegion( TESStesselator *tess, ActiveRegion *reg )
	Sweep.topLeftRegion = function( tess, reg ) {
		var org = reg.eUp.Org;
		var e;

		/* Find the region above the uppermost edge with the same origin */
		do {
			reg = Sweep.regionAbove( reg );
		} while( reg.eUp.Org === org );

		/* If the edge above was a temporary edge introduced by ConnectRightVertex,
		* now is the time to fix it.
		*/
		if( reg.fixUpperEdge ) {
			e = tess.mesh.connect( Sweep.regionBelow(reg).eUp.Sym, reg.eUp.Lnext );
			if (e === null) return null;
			Sweep.fixUpperEdge( tess, reg, e );
			reg = Sweep.regionAbove( reg );
		}
		return reg;
	}

	//static ActiveRegion *TopRightRegion( ActiveRegion *reg )
	Sweep.topRightRegion = function( reg )
	{
		var dst = reg.eUp.Dst;
		var reg = null;
		/* Find the region above the uppermost edge with the same destination */
		do {
			reg = Sweep.regionAbove( reg );
		} while( reg.eUp.Dst === dst );
		return reg;
	}

	//static ActiveRegion *AddRegionBelow( TESStesselator *tess, ActiveRegion *regAbove, TESShalfEdge *eNewUp )
	Sweep.addRegionBelow = function( tess, regAbove, eNewUp ) {
		/*
		* Add a new active region to the sweep line, *somewhere* below "regAbove"
		* (according to where the new edge belongs in the sweep-line dictionary).
		* The upper edge of the new region will be "eNewUp".
		* Winding number and "inside" flag are not updated.
		*/
		var regNew = new ActiveRegion();
		regNew.eUp = eNewUp;
		regNew.nodeUp = tess.dict.insertBefore( regAbove.nodeUp, regNew );
	//	if (regNew->nodeUp == NULL) longjmp(tess->env,1);
		regNew.fixUpperEdge = false;
		regNew.sentinel = false;
		regNew.dirty = false;

		eNewUp.activeRegion = regNew;
		return regNew;
	}

	//static int IsWindingInside( TESStesselator *tess, int n )
	Sweep.isWindingInside = function( tess, n ) {
		switch( tess.windingRule ) {
			case Tess2$1.WINDING_ODD:
				return (n & 1) != 0;
			case Tess2$1.WINDING_NONZERO:
				return (n != 0);
			case Tess2$1.WINDING_POSITIVE:
				return (n > 0);
			case Tess2$1.WINDING_NEGATIVE:
				return (n < 0);
			case Tess2$1.WINDING_ABS_GEQ_TWO:
				return (n >= 2) || (n <= -2);
		}
		assert( false );
		return false;
	}

	//static void ComputeWinding( TESStesselator *tess, ActiveRegion *reg )
	Sweep.computeWinding = function( tess, reg ) {
		reg.windingNumber = Sweep.regionAbove(reg).windingNumber + reg.eUp.winding;
		reg.inside = Sweep.isWindingInside( tess, reg.windingNumber );
	}


	//static void FinishRegion( TESStesselator *tess, ActiveRegion *reg )
	Sweep.finishRegion = function( tess, reg ) {
		/*
		* Delete a region from the sweep line.  This happens when the upper
		* and lower chains of a region meet (at a vertex on the sweep line).
		* The "inside" flag is copied to the appropriate mesh face (we could
		* not do this before -- since the structure of the mesh is always
		* changing, this face may not have even existed until now).
		*/
		var e = reg.eUp;
		var f = e.Lface;

		f.inside = reg.inside;
		f.anEdge = e;   /* optimization for tessMeshTessellateMonoRegion() */
		Sweep.deleteRegion( tess, reg );
	}


	//static TESShalfEdge *FinishLeftRegions( TESStesselator *tess, ActiveRegion *regFirst, ActiveRegion *regLast )
	Sweep.finishLeftRegions = function( tess, regFirst, regLast ) {
		/*
		* We are given a vertex with one or more left-going edges.  All affected
		* edges should be in the edge dictionary.  Starting at regFirst->eUp,
		* we walk down deleting all regions where both edges have the same
		* origin vOrg.  At the same time we copy the "inside" flag from the
		* active region to the face, since at this point each face will belong
		* to at most one region (this was not necessarily true until this point
		* in the sweep).  The walk stops at the region above regLast; if regLast
		* is NULL we walk as far as possible.  At the same time we relink the
		* mesh if necessary, so that the ordering of edges around vOrg is the
		* same as in the dictionary.
		*/
		var e, ePrev;
		var reg = null;
		var regPrev = regFirst;
		var ePrev = regFirst.eUp;
		while( regPrev !== regLast ) {
			regPrev.fixUpperEdge = false;	/* placement was OK */
			reg = Sweep.regionBelow( regPrev );
			e = reg.eUp;
			if( e.Org != ePrev.Org ) {
				if( ! reg.fixUpperEdge ) {
					/* Remove the last left-going edge.  Even though there are no further
					* edges in the dictionary with this origin, there may be further
					* such edges in the mesh (if we are adding left edges to a vertex
					* that has already been processed).  Thus it is important to call
					* FinishRegion rather than just DeleteRegion.
					*/
					Sweep.finishRegion( tess, regPrev );
					break;
				}
				/* If the edge below was a temporary edge introduced by
				* ConnectRightVertex, now is the time to fix it.
				*/
				e = tess.mesh.connect( ePrev.Lprev, e.Sym );
	//			if (e == NULL) longjmp(tess->env,1);
				Sweep.fixUpperEdge( tess, reg, e );
			}

			/* Relink edges so that ePrev->Onext == e */
			if( ePrev.Onext !== e ) {
				tess.mesh.splice( e.Oprev, e );
				tess.mesh.splice( ePrev, e );
			}
			Sweep.finishRegion( tess, regPrev );	/* may change reg->eUp */
			ePrev = reg.eUp;
			regPrev = reg;
		}
		return ePrev;
	}


	//static void AddRightEdges( TESStesselator *tess, ActiveRegion *regUp, TESShalfEdge *eFirst, TESShalfEdge *eLast, TESShalfEdge *eTopLeft, int cleanUp )
	Sweep.addRightEdges = function( tess, regUp, eFirst, eLast, eTopLeft, cleanUp ) {
		/*
		* Purpose: insert right-going edges into the edge dictionary, and update
		* winding numbers and mesh connectivity appropriately.  All right-going
		* edges share a common origin vOrg.  Edges are inserted CCW starting at
		* eFirst; the last edge inserted is eLast->Oprev.  If vOrg has any
		* left-going edges already processed, then eTopLeft must be the edge
		* such that an imaginary upward vertical segment from vOrg would be
		* contained between eTopLeft->Oprev and eTopLeft; otherwise eTopLeft
		* should be NULL.
		*/
		var reg, regPrev;
		var e, ePrev;
		var firstTime = true;

		/* Insert the new right-going edges in the dictionary */
		e = eFirst;
		do {
			assert( Geom.vertLeq( e.Org, e.Dst ));
			Sweep.addRegionBelow( tess, regUp, e.Sym );
			e = e.Onext;
		} while ( e !== eLast );

		/* Walk *all* right-going edges from e->Org, in the dictionary order,
		* updating the winding numbers of each region, and re-linking the mesh
		* edges to match the dictionary ordering (if necessary).
		*/
		if( eTopLeft === null ) {
			eTopLeft = Sweep.regionBelow( regUp ).eUp.Rprev;
		}
		regPrev = regUp;
		ePrev = eTopLeft;
		for( ;; ) {
			reg = Sweep.regionBelow( regPrev );
			e = reg.eUp.Sym;
			if( e.Org !== ePrev.Org ) break;

			if( e.Onext !== ePrev ) {
				/* Unlink e from its current position, and relink below ePrev */
				tess.mesh.splice( e.Oprev, e );
				tess.mesh.splice( ePrev.Oprev, e );
			}
			/* Compute the winding number and "inside" flag for the new regions */
			reg.windingNumber = regPrev.windingNumber - e.winding;
			reg.inside = Sweep.isWindingInside( tess, reg.windingNumber );

			/* Check for two outgoing edges with same slope -- process these
			* before any intersection tests (see example in tessComputeInterior).
			*/
			regPrev.dirty = true;
			if( ! firstTime && Sweep.checkForRightSplice( tess, regPrev )) {
				Sweep.addWinding( e, ePrev );
				Sweep.deleteRegion( tess, regPrev );
				tess.mesh.delete( ePrev );
			}
			firstTime = false;
			regPrev = reg;
			ePrev = e;
		}
		regPrev.dirty = true;
		assert( regPrev.windingNumber - e.winding === reg.windingNumber );

		if( cleanUp ) {
			/* Check for intersections between newly adjacent edges. */
			Sweep.walkDirtyRegions( tess, regPrev );
		}
	}


	//static void SpliceMergeVertices( TESStesselator *tess, TESShalfEdge *e1, TESShalfEdge *e2 )
	Sweep.spliceMergeVertices = function( tess, e1, e2 ) {
		/*
		* Two vertices with idential coordinates are combined into one.
		* e1->Org is kept, while e2->Org is discarded.
		*/
		tess.mesh.splice( e1, e2 ); 
	}

	//static void VertexWeights( TESSvertex *isect, TESSvertex *org, TESSvertex *dst, TESSreal *weights )
	Sweep.vertexWeights = function( isect, org, dst ) {
		/*
		* Find some weights which describe how the intersection vertex is
		* a linear combination of "org" and "dest".  Each of the two edges
		* which generated "isect" is allocated 50% of the weight; each edge
		* splits the weight between its org and dst according to the
		* relative distance to "isect".
		*/
		var t1 = Geom.vertL1dist( org, isect );
		var t2 = Geom.vertL1dist( dst, isect );
		var w0 = 0.5 * t2 / (t1 + t2);
		var w1 = 0.5 * t1 / (t1 + t2);
		isect.coords[0] += w0*org.coords[0] + w1*dst.coords[0];
		isect.coords[1] += w0*org.coords[1] + w1*dst.coords[1];
		isect.coords[2] += w0*org.coords[2] + w1*dst.coords[2];
	}


	//static void GetIntersectData( TESStesselator *tess, TESSvertex *isect, TESSvertex *orgUp, TESSvertex *dstUp, TESSvertex *orgLo, TESSvertex *dstLo )
	Sweep.getIntersectData = function( tess, isect, orgUp, dstUp, orgLo, dstLo ) {
		 /*
		 * We've computed a new intersection point, now we need a "data" pointer
		 * from the user so that we can refer to this new vertex in the
		 * rendering callbacks.
		 */
		isect.coords[0] = isect.coords[1] = isect.coords[2] = 0;
		isect.idx = -1;
		Sweep.vertexWeights( isect, orgUp, dstUp );
		Sweep.vertexWeights( isect, orgLo, dstLo );
	}

	//static int CheckForRightSplice( TESStesselator *tess, ActiveRegion *regUp )
	Sweep.checkForRightSplice = function( tess, regUp ) {
		/*
		* Check the upper and lower edge of "regUp", to make sure that the
		* eUp->Org is above eLo, or eLo->Org is below eUp (depending on which
		* origin is leftmost).
		*
		* The main purpose is to splice right-going edges with the same
		* dest vertex and nearly identical slopes (ie. we can't distinguish
		* the slopes numerically).  However the splicing can also help us
		* to recover from numerical errors.  For example, suppose at one
		* point we checked eUp and eLo, and decided that eUp->Org is barely
		* above eLo.  Then later, we split eLo into two edges (eg. from
		* a splice operation like this one).  This can change the result of
		* our test so that now eUp->Org is incident to eLo, or barely below it.
		* We must correct this condition to maintain the dictionary invariants.
		*
		* One possibility is to check these edges for intersection again
		* (ie. CheckForIntersect).  This is what we do if possible.  However
		* CheckForIntersect requires that tess->event lies between eUp and eLo,
		* so that it has something to fall back on when the intersection
		* calculation gives us an unusable answer.  So, for those cases where
		* we can't check for intersection, this routine fixes the problem
		* by just splicing the offending vertex into the other edge.
		* This is a guaranteed solution, no matter how degenerate things get.
		* Basically this is a combinatorial solution to a numerical problem.
		*/
		var regLo = Sweep.regionBelow(regUp);
		var eUp = regUp.eUp;
		var eLo = regLo.eUp;

		if( Geom.vertLeq( eUp.Org, eLo.Org )) {
			if( Geom.edgeSign( eLo.Dst, eUp.Org, eLo.Org ) > 0 ) return false;

			/* eUp->Org appears to be below eLo */
			if( ! Geom.vertEq( eUp.Org, eLo.Org )) {
				/* Splice eUp->Org into eLo */
				tess.mesh.splitEdge( eLo.Sym );
				tess.mesh.splice( eUp, eLo.Oprev );
				regUp.dirty = regLo.dirty = true;

			} else if( eUp.Org !== eLo.Org ) {
				/* merge the two vertices, discarding eUp->Org */
				tess.pq.delete( eUp.Org.pqHandle );
				Sweep.spliceMergeVertices( tess, eLo.Oprev, eUp );
			}
		} else {
			if( Geom.edgeSign( eUp.Dst, eLo.Org, eUp.Org ) < 0 ) return false;

			/* eLo->Org appears to be above eUp, so splice eLo->Org into eUp */
			Sweep.regionAbove(regUp).dirty = regUp.dirty = true;
			tess.mesh.splitEdge( eUp.Sym );
			tess.mesh.splice( eLo.Oprev, eUp );
		}
		return true;
	}

	//static int CheckForLeftSplice( TESStesselator *tess, ActiveRegion *regUp )
	Sweep.checkForLeftSplice = function( tess, regUp ) {
		/*
		* Check the upper and lower edge of "regUp", to make sure that the
		* eUp->Dst is above eLo, or eLo->Dst is below eUp (depending on which
		* destination is rightmost).
		*
		* Theoretically, this should always be true.  However, splitting an edge
		* into two pieces can change the results of previous tests.  For example,
		* suppose at one point we checked eUp and eLo, and decided that eUp->Dst
		* is barely above eLo.  Then later, we split eLo into two edges (eg. from
		* a splice operation like this one).  This can change the result of
		* the test so that now eUp->Dst is incident to eLo, or barely below it.
		* We must correct this condition to maintain the dictionary invariants
		* (otherwise new edges might get inserted in the wrong place in the
		* dictionary, and bad stuff will happen).
		*
		* We fix the problem by just splicing the offending vertex into the
		* other edge.
		*/
		var regLo = Sweep.regionBelow(regUp);
		var eUp = regUp.eUp;
		var eLo = regLo.eUp;
		var e;

		assert( ! Geom.vertEq( eUp.Dst, eLo.Dst ));

		if( Geom.vertLeq( eUp.Dst, eLo.Dst )) {
			if( Geom.edgeSign( eUp.Dst, eLo.Dst, eUp.Org ) < 0 ) return false;

			/* eLo->Dst is above eUp, so splice eLo->Dst into eUp */
			Sweep.regionAbove(regUp).dirty = regUp.dirty = true;
			e = tess.mesh.splitEdge( eUp );
			tess.mesh.splice( eLo.Sym, e );
			e.Lface.inside = regUp.inside;
		} else {
			if( Geom.edgeSign( eLo.Dst, eUp.Dst, eLo.Org ) > 0 ) return false;

			/* eUp->Dst is below eLo, so splice eUp->Dst into eLo */
			regUp.dirty = regLo.dirty = true;
			e = tess.mesh.splitEdge( eLo );
			tess.mesh.splice( eUp.Lnext, eLo.Sym );
			e.Rface.inside = regUp.inside;
		}
		return true;
	}


	//static int CheckForIntersect( TESStesselator *tess, ActiveRegion *regUp )
	Sweep.checkForIntersect = function( tess, regUp ) {
		/*
		* Check the upper and lower edges of the given region to see if
		* they intersect.  If so, create the intersection and add it
		* to the data structures.
		*
		* Returns TRUE if adding the new intersection resulted in a recursive
		* call to AddRightEdges(); in this case all "dirty" regions have been
		* checked for intersections, and possibly regUp has been deleted.
		*/
		var regLo = Sweep.regionBelow(regUp);
		var eUp = regUp.eUp;
		var eLo = regLo.eUp;
		var orgUp = eUp.Org;
		var orgLo = eLo.Org;
		var dstUp = eUp.Dst;
		var dstLo = eLo.Dst;
		var tMinUp, tMaxLo;
		var isect = new TESSvertex, orgMin;
		var e;

		assert( ! Geom.vertEq( dstLo, dstUp ));
		assert( Geom.edgeSign( dstUp, tess.event, orgUp ) <= 0 );
		assert( Geom.edgeSign( dstLo, tess.event, orgLo ) >= 0 );
		assert( orgUp !== tess.event && orgLo !== tess.event );
		assert( ! regUp.fixUpperEdge && ! regLo.fixUpperEdge );

		if( orgUp === orgLo ) return false;	/* right endpoints are the same */

		tMinUp = Math.min( orgUp.t, dstUp.t );
		tMaxLo = Math.max( orgLo.t, dstLo.t );
		if( tMinUp > tMaxLo ) return false;	/* t ranges do not overlap */

		if( Geom.vertLeq( orgUp, orgLo )) {
			if( Geom.edgeSign( dstLo, orgUp, orgLo ) > 0 ) return false;
		} else {
			if( Geom.edgeSign( dstUp, orgLo, orgUp ) < 0 ) return false;
		}

		/* At this point the edges intersect, at least marginally */
		Sweep.debugEvent( tess );

		Geom.intersect( dstUp, orgUp, dstLo, orgLo, isect );
		/* The following properties are guaranteed: */
		assert( Math.min( orgUp.t, dstUp.t ) <= isect.t );
		assert( isect.t <= Math.max( orgLo.t, dstLo.t ));
		assert( Math.min( dstLo.s, dstUp.s ) <= isect.s );
		assert( isect.s <= Math.max( orgLo.s, orgUp.s ));

		if( Geom.vertLeq( isect, tess.event )) {
			/* The intersection point lies slightly to the left of the sweep line,
			* so move it until it''s slightly to the right of the sweep line.
			* (If we had perfect numerical precision, this would never happen
			* in the first place).  The easiest and safest thing to do is
			* replace the intersection by tess->event.
			*/
			isect.s = tess.event.s;
			isect.t = tess.event.t;
		}
		/* Similarly, if the computed intersection lies to the right of the
		* rightmost origin (which should rarely happen), it can cause
		* unbelievable inefficiency on sufficiently degenerate inputs.
		* (If you have the test program, try running test54.d with the
		* "X zoom" option turned on).
		*/
		orgMin = Geom.vertLeq( orgUp, orgLo ) ? orgUp : orgLo;
		if( Geom.vertLeq( orgMin, isect )) {
			isect.s = orgMin.s;
			isect.t = orgMin.t;
		}

		if( Geom.vertEq( isect, orgUp ) || Geom.vertEq( isect, orgLo )) {
			/* Easy case -- intersection at one of the right endpoints */
			Sweep.checkForRightSplice( tess, regUp );
			return false;
		}

		if(    (! Geom.vertEq( dstUp, tess.event )
			&& Geom.edgeSign( dstUp, tess.event, isect ) >= 0)
			|| (! Geom.vertEq( dstLo, tess.event )
			&& Geom.edgeSign( dstLo, tess.event, isect ) <= 0 ))
		{
			/* Very unusual -- the new upper or lower edge would pass on the
			* wrong side of the sweep event, or through it.  This can happen
			* due to very small numerical errors in the intersection calculation.
			*/
			if( dstLo === tess.event ) {
				/* Splice dstLo into eUp, and process the new region(s) */
				tess.mesh.splitEdge( eUp.Sym );
				tess.mesh.splice( eLo.Sym, eUp );
				regUp = Sweep.topLeftRegion( tess, regUp );
	//			if (regUp == NULL) longjmp(tess->env,1);
				eUp = Sweep.regionBelow(regUp).eUp;
				Sweep.finishLeftRegions( tess, Sweep.regionBelow(regUp), regLo );
				Sweep.addRightEdges( tess, regUp, eUp.Oprev, eUp, eUp, true );
				return TRUE;
			}
			if( dstUp === tess.event ) {
				/* Splice dstUp into eLo, and process the new region(s) */
				tess.mesh.splitEdge( eLo.Sym );
				tess.mesh.splice( eUp.Lnext, eLo.Oprev ); 
				regLo = regUp;
				regUp = Sweep.topRightRegion( regUp );
				e = Sweep.regionBelow(regUp).eUp.Rprev;
				regLo.eUp = eLo.Oprev;
				eLo = Sweep.finishLeftRegions( tess, regLo, null );
				Sweep.addRightEdges( tess, regUp, eLo.Onext, eUp.Rprev, e, true );
				return true;
			}
			/* Special case: called from ConnectRightVertex.  If either
			* edge passes on the wrong side of tess->event, split it
			* (and wait for ConnectRightVertex to splice it appropriately).
			*/
			if( Geom.edgeSign( dstUp, tess.event, isect ) >= 0 ) {
				Sweep.regionAbove(regUp).dirty = regUp.dirty = true;
				tess.mesh.splitEdge( eUp.Sym );
				eUp.Org.s = tess.event.s;
				eUp.Org.t = tess.event.t;
			}
			if( Geom.edgeSign( dstLo, tess.event, isect ) <= 0 ) {
				regUp.dirty = regLo.dirty = true;
				tess.mesh.splitEdge( eLo.Sym );
				eLo.Org.s = tess.event.s;
				eLo.Org.t = tess.event.t;
			}
			/* leave the rest for ConnectRightVertex */
			return false;
		}

		/* General case -- split both edges, splice into new vertex.
		* When we do the splice operation, the order of the arguments is
		* arbitrary as far as correctness goes.  However, when the operation
		* creates a new face, the work done is proportional to the size of
		* the new face.  We expect the faces in the processed part of
		* the mesh (ie. eUp->Lface) to be smaller than the faces in the
		* unprocessed original contours (which will be eLo->Oprev->Lface).
		*/
		tess.mesh.splitEdge( eUp.Sym );
		tess.mesh.splitEdge( eLo.Sym );
		tess.mesh.splice( eLo.Oprev, eUp );
		eUp.Org.s = isect.s;
		eUp.Org.t = isect.t;
		eUp.Org.pqHandle = tess.pq.insert( eUp.Org );
		Sweep.getIntersectData( tess, eUp.Org, orgUp, dstUp, orgLo, dstLo );
		Sweep.regionAbove(regUp).dirty = regUp.dirty = regLo.dirty = true;
		return false;
	}

	//static void WalkDirtyRegions( TESStesselator *tess, ActiveRegion *regUp )
	Sweep.walkDirtyRegions = function( tess, regUp ) {
		/*
		* When the upper or lower edge of any region changes, the region is
		* marked "dirty".  This routine walks through all the dirty regions
		* and makes sure that the dictionary invariants are satisfied
		* (see the comments at the beginning of this file).  Of course
		* new dirty regions can be created as we make changes to restore
		* the invariants.
		*/
		var regLo = Sweep.regionBelow(regUp);
		var eUp, eLo;

		for( ;; ) {
			/* Find the lowest dirty region (we walk from the bottom up). */
			while( regLo.dirty ) {
				regUp = regLo;
				regLo = Sweep.regionBelow(regLo);
			}
			if( ! regUp.dirty ) {
				regLo = regUp;
				regUp = Sweep.regionAbove( regUp );
				if( regUp == null || ! regUp.dirty ) {
					/* We've walked all the dirty regions */
					return;
				}
			}
			regUp.dirty = false;
			eUp = regUp.eUp;
			eLo = regLo.eUp;

			if( eUp.Dst !== eLo.Dst ) {
				/* Check that the edge ordering is obeyed at the Dst vertices. */
				if( Sweep.checkForLeftSplice( tess, regUp )) {

					/* If the upper or lower edge was marked fixUpperEdge, then
					* we no longer need it (since these edges are needed only for
					* vertices which otherwise have no right-going edges).
					*/
					if( regLo.fixUpperEdge ) {
						Sweep.deleteRegion( tess, regLo );
						tess.mesh.delete( eLo );
						regLo = Sweep.regionBelow( regUp );
						eLo = regLo.eUp;
					} else if( regUp.fixUpperEdge ) {
						Sweep.deleteRegion( tess, regUp );
						tess.mesh.delete( eUp );
						regUp = Sweep.regionAbove( regLo );
						eUp = regUp.eUp;
					}
				}
			}
			if( eUp.Org !== eLo.Org ) {
				if(    eUp.Dst !== eLo.Dst
					&& ! regUp.fixUpperEdge && ! regLo.fixUpperEdge
					&& (eUp.Dst === tess.event || eLo.Dst === tess.event) )
				{
					/* When all else fails in CheckForIntersect(), it uses tess->event
					* as the intersection location.  To make this possible, it requires
					* that tess->event lie between the upper and lower edges, and also
					* that neither of these is marked fixUpperEdge (since in the worst
					* case it might splice one of these edges into tess->event, and
					* violate the invariant that fixable edges are the only right-going
					* edge from their associated vertex).
					*/
					if( Sweep.checkForIntersect( tess, regUp )) {
						/* WalkDirtyRegions() was called recursively; we're done */
						return;
					}
				} else {
					/* Even though we can't use CheckForIntersect(), the Org vertices
					* may violate the dictionary edge ordering.  Check and correct this.
					*/
					Sweep.checkForRightSplice( tess, regUp );
				}
			}
			if( eUp.Org === eLo.Org && eUp.Dst === eLo.Dst ) {
				/* A degenerate loop consisting of only two edges -- delete it. */
				Sweep.addWinding( eLo, eUp );
				Sweep.deleteRegion( tess, regUp );
				tess.mesh.delete( eUp );
				regUp = Sweep.regionAbove( regLo );
			}
		}
	}


	//static void ConnectRightVertex( TESStesselator *tess, ActiveRegion *regUp, TESShalfEdge *eBottomLeft )
	Sweep.connectRightVertex = function( tess, regUp, eBottomLeft ) {
		/*
		* Purpose: connect a "right" vertex vEvent (one where all edges go left)
		* to the unprocessed portion of the mesh.  Since there are no right-going
		* edges, two regions (one above vEvent and one below) are being merged
		* into one.  "regUp" is the upper of these two regions.
		*
		* There are two reasons for doing this (adding a right-going edge):
		*  - if the two regions being merged are "inside", we must add an edge
		*    to keep them separated (the combined region would not be monotone).
		*  - in any case, we must leave some record of vEvent in the dictionary,
		*    so that we can merge vEvent with features that we have not seen yet.
		*    For example, maybe there is a vertical edge which passes just to
		*    the right of vEvent; we would like to splice vEvent into this edge.
		*
		* However, we don't want to connect vEvent to just any vertex.  We don''t
		* want the new edge to cross any other edges; otherwise we will create
		* intersection vertices even when the input data had no self-intersections.
		* (This is a bad thing; if the user's input data has no intersections,
		* we don't want to generate any false intersections ourselves.)
		*
		* Our eventual goal is to connect vEvent to the leftmost unprocessed
		* vertex of the combined region (the union of regUp and regLo).
		* But because of unseen vertices with all right-going edges, and also
		* new vertices which may be created by edge intersections, we don''t
		* know where that leftmost unprocessed vertex is.  In the meantime, we
		* connect vEvent to the closest vertex of either chain, and mark the region
		* as "fixUpperEdge".  This flag says to delete and reconnect this edge
		* to the next processed vertex on the boundary of the combined region.
		* Quite possibly the vertex we connected to will turn out to be the
		* closest one, in which case we won''t need to make any changes.
		*/
		var eNew;
		var eTopLeft = eBottomLeft.Onext;
		var regLo = Sweep.regionBelow(regUp);
		var eUp = regUp.eUp;
		var eLo = regLo.eUp;
		var degenerate = false;

		if( eUp.Dst !== eLo.Dst ) {
			Sweep.checkForIntersect( tess, regUp );
		}

		/* Possible new degeneracies: upper or lower edge of regUp may pass
		* through vEvent, or may coincide with new intersection vertex
		*/
		if( Geom.vertEq( eUp.Org, tess.event )) {
			tess.mesh.splice( eTopLeft.Oprev, eUp );
			regUp = Sweep.topLeftRegion( tess, regUp );
			eTopLeft = Sweep.regionBelow( regUp ).eUp;
			Sweep.finishLeftRegions( tess, Sweep.regionBelow(regUp), regLo );
			degenerate = true;
		}
		if( Geom.vertEq( eLo.Org, tess.event )) {
			tess.mesh.splice( eBottomLeft, eLo.Oprev );
			eBottomLeft = Sweep.finishLeftRegions( tess, regLo, null );
			degenerate = true;
		}
		if( degenerate ) {
			Sweep.addRightEdges( tess, regUp, eBottomLeft.Onext, eTopLeft, eTopLeft, true );
			return;
		}

		/* Non-degenerate situation -- need to add a temporary, fixable edge.
		* Connect to the closer of eLo->Org, eUp->Org.
		*/
		if( Geom.vertLeq( eLo.Org, eUp.Org )) {
			eNew = eLo.Oprev;
		} else {
			eNew = eUp;
		}
		eNew = tess.mesh.connect( eBottomLeft.Lprev, eNew );

		/* Prevent cleanup, otherwise eNew might disappear before we've even
		* had a chance to mark it as a temporary edge.
		*/
		Sweep.addRightEdges( tess, regUp, eNew, eNew.Onext, eNew.Onext, false );
		eNew.Sym.activeRegion.fixUpperEdge = true;
		Sweep.walkDirtyRegions( tess, regUp );
	}

	/* Because vertices at exactly the same location are merged together
	* before we process the sweep event, some degenerate cases can't occur.
	* However if someone eventually makes the modifications required to
	* merge features which are close together, the cases below marked
	* TOLERANCE_NONZERO will be useful.  They were debugged before the
	* code to merge identical vertices in the main loop was added.
	*/
	//#define TOLERANCE_NONZERO	FALSE

	//static void ConnectLeftDegenerate( TESStesselator *tess, ActiveRegion *regUp, TESSvertex *vEvent )
	Sweep.connectLeftDegenerate = function( tess, regUp, vEvent ) {
		/*
		* The event vertex lies exacty on an already-processed edge or vertex.
		* Adding the new vertex involves splicing it into the already-processed
		* part of the mesh.
		*/
		var e, eTopLeft, eTopRight, eLast;
		var reg;

		e = regUp.eUp;
		if( Geom.vertEq( e.Org, vEvent )) {
			/* e->Org is an unprocessed vertex - just combine them, and wait
			* for e->Org to be pulled from the queue
			*/
			assert( false /*TOLERANCE_NONZERO*/ );
			Sweep.spliceMergeVertices( tess, e, vEvent.anEdge );
			return;
		}

		if( ! Geom.vertEq( e.Dst, vEvent )) {
			/* General case -- splice vEvent into edge e which passes through it */
			tess.mesh.splitEdge( e.Sym );
			if( regUp.fixUpperEdge ) {
				/* This edge was fixable -- delete unused portion of original edge */
				tess.mesh.delete( e.Onext );
				regUp.fixUpperEdge = false;
			}
			tess.mesh.splice( vEvent.anEdge, e );
			Sweep.sweepEvent( tess, vEvent );	/* recurse */
			return;
		}

		/* vEvent coincides with e->Dst, which has already been processed.
		* Splice in the additional right-going edges.
		*/
		assert( false /*TOLERANCE_NONZERO*/ );
		regUp = Sweep.topRightRegion( regUp );
		reg = Sweep.regionBelow( regUp );
		eTopRight = reg.eUp.Sym;
		eTopLeft = eLast = eTopRight.Onext;
		if( reg.fixUpperEdge ) {
			/* Here e->Dst has only a single fixable edge going right.
			* We can delete it since now we have some real right-going edges.
			*/
			assert( eTopLeft !== eTopRight );   /* there are some left edges too */
			Sweep.deleteRegion( tess, reg );
			tess.mesh.delete( eTopRight );
			eTopRight = eTopLeft.Oprev;
		}
		tess.mesh.splice( vEvent.anEdge, eTopRight );
		if( ! Geom.edgeGoesLeft( eTopLeft )) {
			/* e->Dst had no left-going edges -- indicate this to AddRightEdges() */
			eTopLeft = null;
		}
		Sweep.addRightEdges( tess, regUp, eTopRight.Onext, eLast, eTopLeft, true );
	}


	//static void ConnectLeftVertex( TESStesselator *tess, TESSvertex *vEvent )
	Sweep.connectLeftVertex = function( tess, vEvent ) {
		/*
		* Purpose: connect a "left" vertex (one where both edges go right)
		* to the processed portion of the mesh.  Let R be the active region
		* containing vEvent, and let U and L be the upper and lower edge
		* chains of R.  There are two possibilities:
		*
		* - the normal case: split R into two regions, by connecting vEvent to
		*   the rightmost vertex of U or L lying to the left of the sweep line
		*
		* - the degenerate case: if vEvent is close enough to U or L, we
		*   merge vEvent into that edge chain.  The subcases are:
		*	- merging with the rightmost vertex of U or L
		*	- merging with the active edge of U or L
		*	- merging with an already-processed portion of U or L
		*/
		var regUp, regLo, reg;
		var eUp, eLo, eNew;
		var tmp = new ActiveRegion();

		/* assert( vEvent->anEdge->Onext->Onext == vEvent->anEdge ); */

		/* Get a pointer to the active region containing vEvent */
		tmp.eUp = vEvent.anEdge.Sym;
		/* __GL_DICTLISTKEY */ /* tessDictListSearch */
		regUp = tess.dict.search( tmp ).key;
		regLo = Sweep.regionBelow( regUp );
		if( !regLo ) {
			// This may happen if the input polygon is coplanar.
			return;
		}
		eUp = regUp.eUp;
		eLo = regLo.eUp;

		/* Try merging with U or L first */
		if( Geom.edgeSign( eUp.Dst, vEvent, eUp.Org ) === 0.0 ) {
			Sweep.connectLeftDegenerate( tess, regUp, vEvent );
			return;
		}

		/* Connect vEvent to rightmost processed vertex of either chain.
		* e->Dst is the vertex that we will connect to vEvent.
		*/
		reg = Geom.vertLeq( eLo.Dst, eUp.Dst ) ? regUp : regLo;

		if( regUp.inside || reg.fixUpperEdge) {
			if( reg === regUp ) {
				eNew = tess.mesh.connect( vEvent.anEdge.Sym, eUp.Lnext );
			} else {
				var tempHalfEdge = tess.mesh.connect( eLo.Dnext, vEvent.anEdge);
				eNew = tempHalfEdge.Sym;
			}
			if( reg.fixUpperEdge ) {
				Sweep.fixUpperEdge( tess, reg, eNew );
			} else {
				Sweep.computeWinding( tess, Sweep.addRegionBelow( tess, regUp, eNew ));
			}
			Sweep.sweepEvent( tess, vEvent );
		} else {
			/* The new vertex is in a region which does not belong to the polygon.
			* We don''t need to connect this vertex to the rest of the mesh.
			*/
			Sweep.addRightEdges( tess, regUp, vEvent.anEdge, vEvent.anEdge, null, true );
		}
	};


	//static void SweepEvent( TESStesselator *tess, TESSvertex *vEvent )
	Sweep.sweepEvent = function( tess, vEvent ) {
		/*
		* Does everything necessary when the sweep line crosses a vertex.
		* Updates the mesh and the edge dictionary.
		*/

		tess.event = vEvent;		/* for access in EdgeLeq() */
		Sweep.debugEvent( tess );

		/* Check if this vertex is the right endpoint of an edge that is
		* already in the dictionary.  In this case we don't need to waste
		* time searching for the location to insert new edges.
		*/
		var e = vEvent.anEdge;
		while( e.activeRegion === null ) {
			e = e.Onext;
			if( e == vEvent.anEdge ) {
				/* All edges go right -- not incident to any processed edges */
				Sweep.connectLeftVertex( tess, vEvent );
				return;
			}
		}

		/* Processing consists of two phases: first we "finish" all the
		* active regions where both the upper and lower edges terminate
		* at vEvent (ie. vEvent is closing off these regions).
		* We mark these faces "inside" or "outside" the polygon according
		* to their winding number, and delete the edges from the dictionary.
		* This takes care of all the left-going edges from vEvent.
		*/
		var regUp = Sweep.topLeftRegion( tess, e.activeRegion );
		assert( regUp !== null );
	//	if (regUp == NULL) longjmp(tess->env,1);
		var reg = Sweep.regionBelow( regUp );
		var eTopLeft = reg.eUp;
		var eBottomLeft = Sweep.finishLeftRegions( tess, reg, null );

		/* Next we process all the right-going edges from vEvent.  This
		* involves adding the edges to the dictionary, and creating the
		* associated "active regions" which record information about the
		* regions between adjacent dictionary edges.
		*/
		if( eBottomLeft.Onext === eTopLeft ) {
			/* No right-going edges -- add a temporary "fixable" edge */
			Sweep.connectRightVertex( tess, regUp, eBottomLeft );
		} else {
			Sweep.addRightEdges( tess, regUp, eBottomLeft.Onext, eTopLeft, eTopLeft, true );
		}
	};


	/* Make the sentinel coordinates big enough that they will never be
	* merged with real input features.
	*/

	//static void AddSentinel( TESStesselator *tess, TESSreal smin, TESSreal smax, TESSreal t )
	Sweep.addSentinel = function( tess, smin, smax, t ) {
		/*
		* We add two sentinel edges above and below all other edges,
		* to avoid special cases at the top and bottom.
		*/
		var reg = new ActiveRegion();
		var e = tess.mesh.makeEdge();
	//	if (e == NULL) longjmp(tess->env,1);

		e.Org.s = smax;
		e.Org.t = t;
		e.Dst.s = smin;
		e.Dst.t = t;
		tess.event = e.Dst;		/* initialize it */

		reg.eUp = e;
		reg.windingNumber = 0;
		reg.inside = false;
		reg.fixUpperEdge = false;
		reg.sentinel = true;
		reg.dirty = false;
		reg.nodeUp = tess.dict.insert( reg );
	//	if (reg->nodeUp == NULL) longjmp(tess->env,1);
	}


	//static void InitEdgeDict( TESStesselator *tess )
	Sweep.initEdgeDict = function( tess ) {
		/*
		* We maintain an ordering of edge intersections with the sweep line.
		* This order is maintained in a dynamic dictionary.
		*/
		tess.dict = new Dict( tess, Sweep.edgeLeq );
	//	if (tess->dict == NULL) longjmp(tess->env,1);

		var w = (tess.bmax[0] - tess.bmin[0]);
		var h = (tess.bmax[1] - tess.bmin[1]);

		var smin = tess.bmin[0] - w;
		var smax = tess.bmax[0] + w;
		var tmin = tess.bmin[1] - h;
		var tmax = tess.bmax[1] + h;

		Sweep.addSentinel( tess, smin, smax, tmin );
		Sweep.addSentinel( tess, smin, smax, tmax );
	}


	Sweep.doneEdgeDict = function( tess )
	{
		var reg;
		var fixedEdges = 0;

		while( (reg = tess.dict.min().key) !== null ) {
			/*
			* At the end of all processing, the dictionary should contain
			* only the two sentinel edges, plus at most one "fixable" edge
			* created by ConnectRightVertex().
			*/
			if( ! reg.sentinel ) {
				assert( reg.fixUpperEdge );
				assert( ++fixedEdges == 1 );
			}
			assert( reg.windingNumber == 0 );
			Sweep.deleteRegion( tess, reg );
			/*    tessMeshDelete( reg->eUp );*/
		}
	//	dictDeleteDict( &tess->alloc, tess->dict );
	}


	Sweep.removeDegenerateEdges = function( tess ) {
		/*
		* Remove zero-length edges, and contours with fewer than 3 vertices.
		*/
		var e, eNext, eLnext;
		var eHead = tess.mesh.eHead;

		/*LINTED*/
		for( e = eHead.next; e !== eHead; e = eNext ) {
			eNext = e.next;
			eLnext = e.Lnext;

			if( Geom.vertEq( e.Org, e.Dst ) && e.Lnext.Lnext !== e ) {
				/* Zero-length edge, contour has at least 3 edges */
				Sweep.spliceMergeVertices( tess, eLnext, e );	/* deletes e->Org */
				tess.mesh.delete( e ); /* e is a self-loop */
				e = eLnext;
				eLnext = e.Lnext;
			}
			if( eLnext.Lnext === e ) {
				/* Degenerate contour (one or two edges) */
				if( eLnext !== e ) {
					if( eLnext === eNext || eLnext === eNext.Sym ) { eNext = eNext.next; }
					tess.mesh.delete( eLnext );
				}
				if( e === eNext || e === eNext.Sym ) { eNext = eNext.next; }
				tess.mesh.delete( e );
			}
		}
	}

	Sweep.initPriorityQ = function( tess ) {
		/*
		* Insert all vertices into the priority queue which determines the
		* order in which vertices cross the sweep line.
		*/
		var pq;
		var v, vHead;
		var vertexCount = 0;
		
		vHead = tess.mesh.vHead;
		for( v = vHead.next; v !== vHead; v = v.next ) {
			vertexCount++;
		}
		/* Make sure there is enough space for sentinels. */
		vertexCount += 8; //MAX( 8, tess->alloc.extraVertices );
		
		pq = tess.pq = new PriorityQ( vertexCount, Geom.vertLeq );
	//	if (pq == NULL) return 0;

		vHead = tess.mesh.vHead;
		for( v = vHead.next; v !== vHead; v = v.next ) {
			v.pqHandle = pq.insert( v );
	//		if (v.pqHandle == INV_HANDLE)
	//			break;
		}

		if (v !== vHead) {
			return false;
		}

		pq.init();

		return true;
	}


	Sweep.donePriorityQ = function( tess ) {
		tess.pq = null;
	}


	Sweep.removeDegenerateFaces = function( tess, mesh ) {
		/*
		* Delete any degenerate faces with only two edges.  WalkDirtyRegions()
		* will catch almost all of these, but it won't catch degenerate faces
		* produced by splice operations on already-processed edges.
		* The two places this can happen are in FinishLeftRegions(), when
		* we splice in a "temporary" edge produced by ConnectRightVertex(),
		* and in CheckForLeftSplice(), where we splice already-processed
		* edges to ensure that our dictionary invariants are not violated
		* by numerical errors.
		*
		* In both these cases it is *very* dangerous to delete the offending
		* edge at the time, since one of the routines further up the stack
		* will sometimes be keeping a pointer to that edge.
		*/
		var f, fNext;
		var e;

		/*LINTED*/
		for( f = mesh.fHead.next; f !== mesh.fHead; f = fNext ) {
			fNext = f.next;
			e = f.anEdge;
			assert( e.Lnext !== e );

			if( e.Lnext.Lnext === e ) {
				/* A face with only two edges */
				Sweep.addWinding( e.Onext, e );
				tess.mesh.delete( e );
			}
		}
		return true;
	}

	Sweep.computeInterior = function( tess ) {
		/*
		* tessComputeInterior( tess ) computes the planar arrangement specified
		* by the given contours, and further subdivides this arrangement
		* into regions.  Each region is marked "inside" if it belongs
		* to the polygon, according to the rule given by tess->windingRule.
		* Each interior region is guaranteed be monotone.
		*/
		var v, vNext;

		/* Each vertex defines an event for our sweep line.  Start by inserting
		* all the vertices in a priority queue.  Events are processed in
		* lexicographic order, ie.
		*
		*	e1 < e2  iff  e1.x < e2.x || (e1.x == e2.x && e1.y < e2.y)
		*/
		Sweep.removeDegenerateEdges( tess );
		if ( !Sweep.initPriorityQ( tess ) ) return false; /* if error */
		Sweep.initEdgeDict( tess );

		while( (v = tess.pq.extractMin()) !== null ) {
			for( ;; ) {
				vNext = tess.pq.min();
				if( vNext === null || ! Geom.vertEq( vNext, v )) break;

				/* Merge together all vertices at exactly the same location.
				* This is more efficient than processing them one at a time,
				* simplifies the code (see ConnectLeftDegenerate), and is also
				* important for correct handling of certain degenerate cases.
				* For example, suppose there are two identical edges A and B
				* that belong to different contours (so without this code they would
				* be processed by separate sweep events).  Suppose another edge C
				* crosses A and B from above.  When A is processed, we split it
				* at its intersection point with C.  However this also splits C,
				* so when we insert B we may compute a slightly different
				* intersection point.  This might leave two edges with a small
				* gap between them.  This kind of error is especially obvious
				* when using boundary extraction (TESS_BOUNDARY_ONLY).
				*/
				vNext = tess.pq.extractMin();
				Sweep.spliceMergeVertices( tess, v.anEdge, vNext.anEdge );
			}
			Sweep.sweepEvent( tess, v );
		}

		/* Set tess->event for debugging purposes */
		tess.event = tess.dict.min().key.eUp.Org;
		Sweep.debugEvent( tess );
		Sweep.doneEdgeDict( tess );
		Sweep.donePriorityQ( tess );

		if ( !Sweep.removeDegenerateFaces( tess, tess.mesh ) ) return false;
		tess.mesh.check();

		return true;
	}


	function Tesselator() {

		/*** state needed for collecting the input data ***/
		this.mesh = null;		/* stores the input contours, and eventually
							the tessellation itself */

		/*** state needed for projecting onto the sweep plane ***/

		this.normal = [0.0, 0.0, 0.0];	/* user-specified normal (if provided) */
		this.sUnit = [0.0, 0.0, 0.0];	/* unit vector in s-direction (debugging) */
		this.tUnit = [0.0, 0.0, 0.0];	/* unit vector in t-direction (debugging) */

		this.bmin = [0.0, 0.0];
		this.bmax = [0.0, 0.0];

		/*** state needed for the line sweep ***/
		this.windingRule = Tess2$1.WINDING_ODD;	/* rule for determining polygon interior */

		this.dict = null;		/* edge dictionary for sweep line */
		this.pq = null;		/* priority queue of vertex events */
		this.event = null;		/* current sweep event being processed */

		this.vertexIndexCounter = 0;
		
		this.vertices = [];
		this.vertexIndices = [];
		this.vertexCount = 0;
		this.elements = [];
		this.elementCount = 0;
	};

	Tesselator.prototype = {

		dot_: function(u, v) {
			return (u[0]*v[0] + u[1]*v[1] + u[2]*v[2]);
		},

		normalize_: function( v ) {
			var len = v[0]*v[0] + v[1]*v[1] + v[2]*v[2];
			assert( len > 0.0 );
			len = Math.sqrt( len );
			v[0] /= len;
			v[1] /= len;
			v[2] /= len;
		},

		longAxis_: function( v ) {
			var i = 0;
			if( Math.abs(v[1]) > Math.abs(v[0]) ) { i = 1; }
			if( Math.abs(v[2]) > Math.abs(v[i]) ) { i = 2; }
			return i;
		},

		computeNormal_: function( norm )
		{
			var v, v1, v2;
			var c, tLen2, maxLen2;
			var maxVal = [0,0,0], minVal = [0,0,0], d1 = [0,0,0], d2 = [0,0,0], tNorm = [0,0,0];
			var maxVert = [null,null,null], minVert = [null,null,null];
			var vHead = this.mesh.vHead;
			var i;

			v = vHead.next;
			for( i = 0; i < 3; ++i ) {
				c = v.coords[i];
				minVal[i] = c;
				minVert[i] = v;
				maxVal[i] = c;
				maxVert[i] = v;
			}

			for( v = vHead.next; v !== vHead; v = v.next ) {
				for( i = 0; i < 3; ++i ) {
					c = v.coords[i];
					if( c < minVal[i] ) { minVal[i] = c; minVert[i] = v; }
					if( c > maxVal[i] ) { maxVal[i] = c; maxVert[i] = v; }
				}
			}

			/* Find two vertices separated by at least 1/sqrt(3) of the maximum
			* distance between any two vertices
			*/
			i = 0;
			if( maxVal[1] - minVal[1] > maxVal[0] - minVal[0] ) { i = 1; }
			if( maxVal[2] - minVal[2] > maxVal[i] - minVal[i] ) { i = 2; }
			if( minVal[i] >= maxVal[i] ) {
				/* All vertices are the same -- normal doesn't matter */
				norm[0] = 0; norm[1] = 0; norm[2] = 1;
				return;
			}

			/* Look for a third vertex which forms the triangle with maximum area
			* (Length of normal == twice the triangle area)
			*/
			maxLen2 = 0;
			v1 = minVert[i];
			v2 = maxVert[i];
			d1[0] = v1.coords[0] - v2.coords[0];
			d1[1] = v1.coords[1] - v2.coords[1];
			d1[2] = v1.coords[2] - v2.coords[2];
			for( v = vHead.next; v !== vHead; v = v.next ) {
				d2[0] = v.coords[0] - v2.coords[0];
				d2[1] = v.coords[1] - v2.coords[1];
				d2[2] = v.coords[2] - v2.coords[2];
				tNorm[0] = d1[1]*d2[2] - d1[2]*d2[1];
				tNorm[1] = d1[2]*d2[0] - d1[0]*d2[2];
				tNorm[2] = d1[0]*d2[1] - d1[1]*d2[0];
				tLen2 = tNorm[0]*tNorm[0] + tNorm[1]*tNorm[1] + tNorm[2]*tNorm[2];
				if( tLen2 > maxLen2 ) {
					maxLen2 = tLen2;
					norm[0] = tNorm[0];
					norm[1] = tNorm[1];
					norm[2] = tNorm[2];
				}
			}

			if( maxLen2 <= 0 ) {
				/* All points lie on a single line -- any decent normal will do */
				norm[0] = norm[1] = norm[2] = 0;
				norm[this.longAxis_(d1)] = 1;
			}
		},

		checkOrientation_: function() {
			var area;
			var f, fHead = this.mesh.fHead;
			var v, vHead = this.mesh.vHead;
			var e;

			/* When we compute the normal automatically, we choose the orientation
			* so that the the sum of the signed areas of all contours is non-negative.
			*/
			area = 0;
			for( f = fHead.next; f !== fHead; f = f.next ) {
				e = f.anEdge;
				if( e.winding <= 0 ) continue;
				do {
					area += (e.Org.s - e.Dst.s) * (e.Org.t + e.Dst.t);
					e = e.Lnext;
				} while( e !== f.anEdge );
			}
			if( area < 0 ) {
				/* Reverse the orientation by flipping all the t-coordinates */
				for( v = vHead.next; v !== vHead; v = v.next ) {
					v.t = - v.t;
				}
				this.tUnit[0] = - this.tUnit[0];
				this.tUnit[1] = - this.tUnit[1];
				this.tUnit[2] = - this.tUnit[2];
			}
		},

	/*	#ifdef FOR_TRITE_TEST_PROGRAM
		#include <stdlib.h>
		extern int RandomSweep;
		#define S_UNIT_X	(RandomSweep ? (2*drand48()-1) : 1.0)
		#define S_UNIT_Y	(RandomSweep ? (2*drand48()-1) : 0.0)
		#else
		#if defined(SLANTED_SWEEP) */
		/* The "feature merging" is not intended to be complete.  There are
		* special cases where edges are nearly parallel to the sweep line
		* which are not implemented.  The algorithm should still behave
		* robustly (ie. produce a reasonable tesselation) in the presence
		* of such edges, however it may miss features which could have been
		* merged.  We could minimize this effect by choosing the sweep line
		* direction to be something unusual (ie. not parallel to one of the
		* coordinate axes).
		*/
	/*	#define S_UNIT_X	(TESSreal)0.50941539564955385	// Pre-normalized
		#define S_UNIT_Y	(TESSreal)0.86052074622010633
		#else
		#define S_UNIT_X	(TESSreal)1.0
		#define S_UNIT_Y	(TESSreal)0.0
		#endif
		#endif*/

		/* Determine the polygon normal and project vertices onto the plane
		* of the polygon.
		*/
		projectPolygon_: function() {
			var v, vHead = this.mesh.vHead;
			var norm = [0,0,0];
			var sUnit, tUnit;
			var i, first, computedNormal = false;

			norm[0] = this.normal[0];
			norm[1] = this.normal[1];
			norm[2] = this.normal[2];
			if( norm[0] === 0.0 && norm[1] === 0.0 && norm[2] === 0.0 ) {
				this.computeNormal_( norm );
				computedNormal = true;
			}
			sUnit = this.sUnit;
			tUnit = this.tUnit;
			i = this.longAxis_( norm );

	/*	#if defined(FOR_TRITE_TEST_PROGRAM) || defined(TRUE_PROJECT)
			// Choose the initial sUnit vector to be approximately perpendicular
			// to the normal.
			
			Normalize( norm );

			sUnit[i] = 0;
			sUnit[(i+1)%3] = S_UNIT_X;
			sUnit[(i+2)%3] = S_UNIT_Y;

			// Now make it exactly perpendicular 
			w = Dot( sUnit, norm );
			sUnit[0] -= w * norm[0];
			sUnit[1] -= w * norm[1];
			sUnit[2] -= w * norm[2];
			Normalize( sUnit );

			// Choose tUnit so that (sUnit,tUnit,norm) form a right-handed frame 
			tUnit[0] = norm[1]*sUnit[2] - norm[2]*sUnit[1];
			tUnit[1] = norm[2]*sUnit[0] - norm[0]*sUnit[2];
			tUnit[2] = norm[0]*sUnit[1] - norm[1]*sUnit[0];
			Normalize( tUnit );
		#else*/
			/* Project perpendicular to a coordinate axis -- better numerically */
			sUnit[i] = 0;
			sUnit[(i+1)%3] = 1.0;
			sUnit[(i+2)%3] = 0.0;

			tUnit[i] = 0;
			tUnit[(i+1)%3] = 0.0;
			tUnit[(i+2)%3] = (norm[i] > 0) ? 1.0 : -1.0;
	//	#endif

			/* Project the vertices onto the sweep plane */
			for( v = vHead.next; v !== vHead; v = v.next ) {
				v.s = this.dot_( v.coords, sUnit );
				v.t = this.dot_( v.coords, tUnit );
			}
			if( computedNormal ) {
				this.checkOrientation_();
			}

			/* Compute ST bounds. */
			first = true;
			for( v = vHead.next; v !== vHead; v = v.next ) {
				if (first) {
					this.bmin[0] = this.bmax[0] = v.s;
					this.bmin[1] = this.bmax[1] = v.t;
					first = false;
				} else {
					if (v.s < this.bmin[0]) this.bmin[0] = v.s;
					if (v.s > this.bmax[0]) this.bmax[0] = v.s;
					if (v.t < this.bmin[1]) this.bmin[1] = v.t;
					if (v.t > this.bmax[1]) this.bmax[1] = v.t;
				}
			}
		},

		addWinding_: function(eDst,eSrc) {
			eDst.winding += eSrc.winding;
			eDst.Sym.winding += eSrc.Sym.winding;
		},
		
		/* tessMeshTessellateMonoRegion( face ) tessellates a monotone region
		* (what else would it do??)  The region must consist of a single
		* loop of half-edges (see mesh.h) oriented CCW.  "Monotone" in this
		* case means that any vertical line intersects the interior of the
		* region in a single interval.  
		*
		* Tessellation consists of adding interior edges (actually pairs of
		* half-edges), to split the region into non-overlapping triangles.
		*
		* The basic idea is explained in Preparata and Shamos (which I don''t
		* have handy right now), although their implementation is more
		* complicated than this one.  The are two edge chains, an upper chain
		* and a lower chain.  We process all vertices from both chains in order,
		* from right to left.
		*
		* The algorithm ensures that the following invariant holds after each
		* vertex is processed: the untessellated region consists of two
		* chains, where one chain (say the upper) is a single edge, and
		* the other chain is concave.  The left vertex of the single edge
		* is always to the left of all vertices in the concave chain.
		*
		* Each step consists of adding the rightmost unprocessed vertex to one
		* of the two chains, and forming a fan of triangles from the rightmost
		* of two chain endpoints.  Determining whether we can add each triangle
		* to the fan is a simple orientation test.  By making the fan as large
		* as possible, we restore the invariant (check it yourself).
		*/
	//	int tessMeshTessellateMonoRegion( TESSmesh *mesh, TESSface *face )
		tessellateMonoRegion_: function( mesh, face ) {
			var up, lo;

			/* All edges are oriented CCW around the boundary of the region.
			* First, find the half-edge whose origin vertex is rightmost.
			* Since the sweep goes from left to right, face->anEdge should
			* be close to the edge we want.
			*/
			up = face.anEdge;
			assert( up.Lnext !== up && up.Lnext.Lnext !== up );

			for( ; Geom.vertLeq( up.Dst, up.Org ); up = up.Lprev )
				;
			for( ; Geom.vertLeq( up.Org, up.Dst ); up = up.Lnext )
				;
			lo = up.Lprev;

			while( up.Lnext !== lo ) {
				if( Geom.vertLeq( up.Dst, lo.Org )) {
					/* up->Dst is on the left.  It is safe to form triangles from lo->Org.
					* The EdgeGoesLeft test guarantees progress even when some triangles
					* are CW, given that the upper and lower chains are truly monotone.
					*/
					while( lo.Lnext !== up && (Geom.edgeGoesLeft( lo.Lnext )
						|| Geom.edgeSign( lo.Org, lo.Dst, lo.Lnext.Dst ) <= 0.0 )) {
							var tempHalfEdge = mesh.connect( lo.Lnext, lo );
							//if (tempHalfEdge == NULL) return 0;
							lo = tempHalfEdge.Sym;
					}
					lo = lo.Lprev;
				} else {
					/* lo->Org is on the left.  We can make CCW triangles from up->Dst. */
					while( lo.Lnext != up && (Geom.edgeGoesRight( up.Lprev )
						|| Geom.edgeSign( up.Dst, up.Org, up.Lprev.Org ) >= 0.0 )) {
							var tempHalfEdge = mesh.connect( up, up.Lprev );
							//if (tempHalfEdge == NULL) return 0;
							up = tempHalfEdge.Sym;
					}
					up = up.Lnext;
				}
			}

			/* Now lo->Org == up->Dst == the leftmost vertex.  The remaining region
			* can be tessellated in a fan from this leftmost vertex.
			*/
			assert( lo.Lnext !== up );
			while( lo.Lnext.Lnext !== up ) {
				var tempHalfEdge = mesh.connect( lo.Lnext, lo );
				//if (tempHalfEdge == NULL) return 0;
				lo = tempHalfEdge.Sym;
			}

			return true;
		},


		/* tessMeshTessellateInterior( mesh ) tessellates each region of
		* the mesh which is marked "inside" the polygon.  Each such region
		* must be monotone.
		*/
		//int tessMeshTessellateInterior( TESSmesh *mesh )
		tessellateInterior_: function( mesh ) {
			var f, next;

			/*LINTED*/
			for( f = mesh.fHead.next; f !== mesh.fHead; f = next ) {
				/* Make sure we don''t try to tessellate the new triangles. */
				next = f.next;
				if( f.inside ) {
					if ( !this.tessellateMonoRegion_( mesh, f ) ) return false;
				}
			}

			return true;
		},


		/* tessMeshDiscardExterior( mesh ) zaps (ie. sets to NULL) all faces
		* which are not marked "inside" the polygon.  Since further mesh operations
		* on NULL faces are not allowed, the main purpose is to clean up the
		* mesh so that exterior loops are not represented in the data structure.
		*/
		//void tessMeshDiscardExterior( TESSmesh *mesh )
		discardExterior_: function( mesh ) {
			var f, next;

			/*LINTED*/
			for( f = mesh.fHead.next; f !== mesh.fHead; f = next ) {
				/* Since f will be destroyed, save its next pointer. */
				next = f.next;
				if( ! f.inside ) {
					mesh.zapFace( f );
				}
			}
		},

		/* tessMeshSetWindingNumber( mesh, value, keepOnlyBoundary ) resets the
		* winding numbers on all edges so that regions marked "inside" the
		* polygon have a winding number of "value", and regions outside
		* have a winding number of 0.
		*
		* If keepOnlyBoundary is TRUE, it also deletes all edges which do not
		* separate an interior region from an exterior one.
		*/
	//	int tessMeshSetWindingNumber( TESSmesh *mesh, int value, int keepOnlyBoundary )
		setWindingNumber_: function( mesh, value, keepOnlyBoundary ) {
			var e, eNext;

			for( e = mesh.eHead.next; e !== mesh.eHead; e = eNext ) {
				eNext = e.next;
				if( e.Rface.inside !== e.Lface.inside ) {

					/* This is a boundary edge (one side is interior, one is exterior). */
					e.winding = (e.Lface.inside) ? value : -value;
				} else {

					/* Both regions are interior, or both are exterior. */
					if( ! keepOnlyBoundary ) {
						e.winding = 0;
					} else {
						mesh.delete( e );
					}
				}
			}
		},

		getNeighbourFace_: function(edge)
		{
			if (!edge.Rface)
				return -1;
			if (!edge.Rface.inside)
				return -1;
			return edge.Rface.n;
		},

		outputPolymesh_: function( mesh, elementType, polySize, vertexSize ) {
			var v;
			var f;
			var edge;
			var maxFaceCount = 0;
			var maxVertexCount = 0;
			var faceVerts, i;
			var elements = 0;
			var vert;

			// Assume that the input data is triangles now.
			// Try to merge as many polygons as possible
			if (polySize > 3)
			{
				mesh.mergeConvexFaces( polySize );
			}

			// Mark unused
			for ( v = mesh.vHead.next; v !== mesh.vHead; v = v.next )
				v.n = -1;

			// Create unique IDs for all vertices and faces.
			for ( f = mesh.fHead.next; f != mesh.fHead; f = f.next )
			{
				f.n = -1;
				if( !f.inside ) continue;

				edge = f.anEdge;
				faceVerts = 0;
				do
				{
					v = edge.Org;
					if ( v.n === -1 )
					{
						v.n = maxVertexCount;
						maxVertexCount++;
					}
					faceVerts++;
					edge = edge.Lnext;
				}
				while (edge !== f.anEdge);
				
				assert( faceVerts <= polySize );

				f.n = maxFaceCount;
				++maxFaceCount;
			}

			this.elementCount = maxFaceCount;
			if (elementType == Tess2$1.CONNECTED_POLYGONS)
				maxFaceCount *= 2;
	/*		tess.elements = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
															  sizeof(TESSindex) * maxFaceCount * polySize );
			if (!tess->elements)
			{
				tess->outOfMemory = 1;
				return;
			}*/
			this.elements = [];
			this.elements.length = maxFaceCount * polySize;
			
			this.vertexCount = maxVertexCount;
	/*		tess->vertices = (TESSreal*)tess->alloc.memalloc( tess->alloc.userData,
															 sizeof(TESSreal) * tess->vertexCount * vertexSize );
			if (!tess->vertices)
			{
				tess->outOfMemory = 1;
				return;
			}*/
			this.vertices = [];
			this.vertices.length = maxVertexCount * vertexSize;

	/*		tess->vertexIndices = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
																    sizeof(TESSindex) * tess->vertexCount );
			if (!tess->vertexIndices)
			{
				tess->outOfMemory = 1;
				return;
			}*/
			this.vertexIndices = [];
			this.vertexIndices.length = maxVertexCount;

			
			// Output vertices.
			for ( v = mesh.vHead.next; v !== mesh.vHead; v = v.next )
			{
				if ( v.n != -1 )
				{
					// Store coordinate
					var idx = v.n * vertexSize;
					this.vertices[idx+0] = v.coords[0];
					this.vertices[idx+1] = v.coords[1];
					if ( vertexSize > 2 )
						this.vertices[idx+2] = v.coords[2];
					// Store vertex index.
					this.vertexIndices[v.n] = v.idx;
				}
			}

			// Output indices.
			var nel = 0;
			for ( f = mesh.fHead.next; f !== mesh.fHead; f = f.next )
			{
				if ( !f.inside ) continue;
				
				// Store polygon
				edge = f.anEdge;
				faceVerts = 0;
				do
				{
					v = edge.Org;
					this.elements[nel++] = v.n;
					faceVerts++;
					edge = edge.Lnext;
				}
				while (edge !== f.anEdge);
				// Fill unused.
				for (i = faceVerts; i < polySize; ++i)
					this.elements[nel++] = -1;

				// Store polygon connectivity
				if ( elementType == Tess2$1.CONNECTED_POLYGONS )
				{
					edge = f.anEdge;
					do
					{
						this.elements[nel++] = this.getNeighbourFace_( edge );
						edge = edge.Lnext;
					}
					while (edge !== f.anEdge);
					// Fill unused.
					for (i = faceVerts; i < polySize; ++i)
						this.elements[nel++] = -1;
				}
			}
		},

	//	void OutputContours( TESStesselator *tess, TESSmesh *mesh, int vertexSize )
		outputContours_: function( mesh, vertexSize ) {
			var f;
			var edge;
			var start;
			var verts;
			var elements;
			var vertInds;
			var startVert = 0;
			var vertCount = 0;

			this.vertexCount = 0;
			this.elementCount = 0;

			for ( f = mesh.fHead.next; f !== mesh.fHead; f = f.next )
			{
				if ( !f.inside ) continue;

				start = edge = f.anEdge;
				do
				{
					this.vertexCount++;
					edge = edge.Lnext;
				}
				while ( edge !== start );

				this.elementCount++;
			}

	/*		tess->elements = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
															  sizeof(TESSindex) * tess->elementCount * 2 );
			if (!tess->elements)
			{
				tess->outOfMemory = 1;
				return;
			}*/
			this.elements = [];
			this.elements.length = this.elementCount * 2;
			
	/*		tess->vertices = (TESSreal*)tess->alloc.memalloc( tess->alloc.userData,
															  sizeof(TESSreal) * tess->vertexCount * vertexSize );
			if (!tess->vertices)
			{
				tess->outOfMemory = 1;
				return;
			}*/
			this.vertices = [];
			this.vertices.length = this.vertexCount * vertexSize;

	/*		tess->vertexIndices = (TESSindex*)tess->alloc.memalloc( tess->alloc.userData,
																    sizeof(TESSindex) * tess->vertexCount );
			if (!tess->vertexIndices)
			{
				tess->outOfMemory = 1;
				return;
			}*/
			this.vertexIndices = [];
			this.vertexIndices.length = this.vertexCount;

			var nv = 0;
			var nvi = 0;
			var nel = 0;
			startVert = 0;

			for ( f = mesh.fHead.next; f !== mesh.fHead; f = f.next )
			{
				if ( !f.inside ) continue;

				vertCount = 0;
				start = edge = f.anEdge;
				do
				{
					this.vertices[nv++] = edge.Org.coords[0];
					this.vertices[nv++] = edge.Org.coords[1];
					if ( vertexSize > 2 )
						this.vertices[nv++] = edge.Org.coords[2];
					this.vertexIndices[nvi++] = edge.Org.idx;
					vertCount++;
					edge = edge.Lnext;
				}
				while ( edge !== start );

				this.elements[nel++] = startVert;
				this.elements[nel++] = vertCount;

				startVert += vertCount;
			}
		},

		addContour: function( size, vertices )
		{
			var e;
			var i;

			if ( this.mesh === null )
			  	this.mesh = new TESSmesh();
	/*	 	if ( tess->mesh == NULL ) {
				tess->outOfMemory = 1;
				return;
			}*/

			if ( size < 2 )
				size = 2;
			if ( size > 3 )
				size = 3;

			e = null;

			for( i = 0; i < vertices.length; i += size )
			{
				if( e == null ) {
					/* Make a self-loop (one vertex, one edge). */
					e = this.mesh.makeEdge();
	/*				if ( e == NULL ) {
						tess->outOfMemory = 1;
						return;
					}*/
					this.mesh.splice( e, e.Sym );
				} else {
					/* Create a new vertex and edge which immediately follow e
					* in the ordering around the left face.
					*/
					this.mesh.splitEdge( e );
					e = e.Lnext;
				}

				/* The new vertex is now e->Org. */
				e.Org.coords[0] = vertices[i+0];
				e.Org.coords[1] = vertices[i+1];
				if ( size > 2 )
					e.Org.coords[2] = vertices[i+2];
				else
					e.Org.coords[2] = 0.0;
				/* Store the insertion number so that the vertex can be later recognized. */
				e.Org.idx = this.vertexIndexCounter++;

				/* The winding of an edge says how the winding number changes as we
				* cross from the edge''s right face to its left face.  We add the
				* vertices in such an order that a CCW contour will add +1 to
				* the winding number of the region inside the contour.
				*/
				e.winding = 1;
				e.Sym.winding = -1;
			}
		},

	//	int tessTesselate( TESStesselator *tess, int windingRule, int elementType, int polySize, int vertexSize, const TESSreal* normal )
		tesselate: function( windingRule, elementType, polySize, vertexSize, normal ) {
			this.vertices = [];
			this.elements = [];
			this.vertexIndices = [];

			this.vertexIndexCounter = 0;
			
			if (normal)
			{
				this.normal[0] = normal[0];
				this.normal[1] = normal[1];
				this.normal[2] = normal[2];
			}

			this.windingRule = windingRule;

			if (vertexSize < 2)
				vertexSize = 2;
			if (vertexSize > 3)
				vertexSize = 3;

	/*		if (setjmp(tess->env) != 0) { 
				// come back here if out of memory
				return 0;
			}*/

			if (!this.mesh)
			{
				return false;
			}

			/* Determine the polygon normal and project vertices onto the plane
			* of the polygon.
			*/
			this.projectPolygon_();

			/* tessComputeInterior( tess ) computes the planar arrangement specified
			* by the given contours, and further subdivides this arrangement
			* into regions.  Each region is marked "inside" if it belongs
			* to the polygon, according to the rule given by tess->windingRule.
			* Each interior region is guaranteed be monotone.
			*/
			Sweep.computeInterior( this );

			var mesh = this.mesh;

			/* If the user wants only the boundary contours, we throw away all edges
			* except those which separate the interior from the exterior.
			* Otherwise we tessellate all the regions marked "inside".
			*/
			if (elementType == Tess2$1.BOUNDARY_CONTOURS) {
				this.setWindingNumber_( mesh, 1, true );
			} else {
				this.tessellateInterior_( mesh ); 
			}
	//		if (rc == 0) longjmp(tess->env,1);  /* could've used a label */

			mesh.check();

			if (elementType == Tess2$1.BOUNDARY_CONTOURS) {
				this.outputContours_( mesh, vertexSize );     /* output contours */
			}
			else
			{
				this.outputPolymesh_( mesh, elementType, polySize, vertexSize );     /* output polygons */
			}

//			tess.mesh = null;

			return true;
		}
	};

var __moduleExports$7 = __moduleExports$8;

var __moduleExports$9 = extend$2

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend$2() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

var Tess2 = __moduleExports$7
var xtend = __moduleExports$9

var index$5 = function(contours, opt) {
    opt = opt||{}
    contours = contours.filter(function(c) {
        return c.length>0
    })
    
    if (contours.length === 0) {
        return { 
            positions: [],
            cells: []
        }
    }

    if (typeof opt.vertexSize !== 'number')
        opt.vertexSize = contours[0][0].length

    //flatten for tess2.js
    contours = contours.map(function(c) {
        return c.reduce(function(a, b) {
            return a.concat(b)
        })
    })

    // Tesselate
    var res = Tess2.tesselate(xtend({
        contours: contours,
        windingRule: Tess2.WINDING_ODD,
        elementType: Tess2.POLYGONS,
        polySize: 3,
        vertexSize: 2
    }, opt))

    var positions = []
    for (var i=0; i<res.vertices.length; i+=opt.vertexSize) {
        var pos = res.vertices.slice(i, i+opt.vertexSize)
        positions.push(pos)
    }
    
    var cells = []
    for (i=0; i<res.elements.length; i+=3) {
        var a = res.elements[i],
            b = res.elements[i+1],
            c = res.elements[i+2]
        cells.push([a, b, c])
    }

    //return a simplicial complex
    return {
        positions: positions,
        cells: cells
    }
}

var cache$1 = {};

function geometryForPath(context, path, threshold) {
  var key = path + ';' + context._tx + ';' + context._ty + ';' + context.z;
  if (cache$1[key]) {
    return cache$1[key];
  }

  threshold = threshold || 1.0;
  if (!path) {
    return {lines: [], triangles: [], closed: false, z: 0};
  }
  // get a list of polylines/contours from svg contents
  var lines = index$4(index$2(path)), tri;

  // simplify the contours before triangulation
  lines = lines.map(function(path) {
    return index$3(path, threshold);
  });

  // triangluate can fail in some corner cases
  try {
    tri = index$5(lines);
  }
  catch(e) {
    console.log('Could not triangulate the following path:');
    console.log(path);
    console.log(e);
    tri = {positions: [], cells: []};
  }

  var z = context._randomZ ? 0.25*(Math.random() - 0.5) : 0,
      tx = context._tx + context._origin[0],
      ty = context._ty + context._origin[1];

  var triangles = [];
  var tcl = tri.cells.length,
      tc = tri.cells,
      tp = tri.positions;
  for (var ci = 0; ci < tcl; ci++) {
    var cell = tc[ci];
    var p1 = tp[cell[0]];
    var p2 = tp[cell[1]];
    var p3 = tp[cell[2]];
    triangles.push(p1[0] + tx, p1[1] + ty, z, p2[0] + tx, p2[1] + ty, z, p3[0] + tx, p3[1] + ty, z);
  }

  var geom = {lines: lines, triangles: triangles, closed: path.endsWith('Z'), z: z};
  cache$1[key] = geom;
  return geom;
}

function x$3(item)     { return item.x || 0; }
function y$3(item)     { return item.y || 0; }
function w(item)     { return item.width || 0; }
function wh(item)    { return item.width || item.height || 1; }
function h(item)     { return item.height || 0; }
function xw(item)    { return (item.x || 0) + (item.width || 0); }
function yh(item)    { return (item.y || 0) + (item.height || 0); }
function cr(item)    { return item.cornerRadius || 0; }
function pa(item)    { return item.padAngle || 0; }
function def(item)   { return !(item.defined === false); }
function size(item)  { return item.size == null ? 64 : item.size; }
function type$1(item) { return symbols$1(item.shape || 'circle'); }

var arcShape    = d3_arc().cornerRadius(cr).padAngle(pa);
var areavShape  = area$2().x(x$3).y1(y$3).y0(yh).defined(def);
var areahShape  = area$2().y(y$3).x1(x$3).x0(xw).defined(def);
var lineShape   = line$2().x(x$3).y(y$3).defined(def);
var trailShape  = vg_trail().x(x$3).y(y$3).defined(def).size(wh);
var rectShape   = vg_rect().x(x$3).y(y$3).width(w).height(h).cornerRadius(cr);
var symbolShape = d3_symbol().type(type$1).size(size);
function arc$1(context, item) {
  if (context.arc) {
    return arcShape.context(context)(item);
  }
  return geometryForPath(context, arcShape.context(null)(item), 0.1);
}

function area$1(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear',
      s = (interp === 'trail' ? trailShape
        : (item.orient === 'horizontal' ? areahShape : areavShape)
            .curve(curves(interp, item.orient, item.tension))
      )
  if (context.arc) {
    return s.context(context)(items);
  }
  return geometryForPath(context, s.context(null)(items), 0.1);
}

var cache = {};

function shape(context, item) {
  var s = item.mark.shape || item.shape;
  if (context.arc) {
    return s.context(context)(item);
  }
  var key = item._id;
  if (cache[key]) {
    return cache[key];
  }
  cache[key] = geometryForPath(context, s.context(null)(item), 1);
  return cache[key];
}

function line$1(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear',
      s = lineShape.curve(curves(interp, item.orient, item.tension));
  if (context.arc) {
    return s.context(context)(items);
  }
  return geometryForPath(context, s.context(null)(items));
}

function rectangle(context, item, x, y) {
  if (context.arc) {
    return rectShape.context(context)(item, x, y);
  }
  return geometryForPath(context, rectShape.context(null)(item, x, y), 0.1);
}

function symbol(context, item) {
  if (context.arc) {
    return symbolShape.context(context)(item);
  }
  return geometryForPath(context, symbolShape.context(null)(item), 0.1);
}

function boundStroke(bounds, item) {
  if (item.stroke && item.opacity !== 0 && item.stokeOpacity !== 0) {
    bounds.expand(item.strokeWidth != null ? +item.strokeWidth : 1);
  }
  return bounds;
}

var bounds$1;
var tau$4 = Math.PI * 2;
var halfPi$2 = Math.PI / 2;
function context(_) {
  return bounds$1 = _, context;
}

function noop$4() {}

function add$3(x, y) { bounds$1.add(x, y); }

context.beginPath = noop$4;

context.closePath = noop$4;

context.moveTo = add$3;

context.lineTo = add$3;

context.rect = function(x, y, w, h) {
  add$3(x, y);
  add$3(x + w, y + h);
};

context.quadraticCurveTo = function(x1, y1, x2, y2) {
  add$3(x1, y1);
  add$3(x2, y2);
};

context.bezierCurveTo = function(x1, y1, x2, y2, x3, y3) {
  add$3(x1, y1);
  add$3(x2, y2);
  add$3(x3, y3);
};

context.arc = function(cx, cy, r, sa, ea, ccw) {
  if (r === tau$4) {
    add$3(cx - r, cy - r);
    add$3(cx + r, cy + r);
    return;
  }

  var xmin = Infinity, xmax = -Infinity,
      ymin = Infinity, ymax = -Infinity,
      s, i, x, y;

  function update(a) {
    x = r * Math.cos(a);
    y = r * Math.sin(a);
    if (x < xmin) xmin = x;
    if (x > xmax) xmax = x;
    if (y < ymin) ymin = y;
    if (y > ymax) ymax = y;
  }

  update(sa);
  update(ea);
  if (ccw) {
    s = ea - (ea % halfPi$2)
    for (i=0; i<4 && s>sa; ++i, s-=halfPi$2) update(s);
  } else {
    s = sa - (sa % halfPi$2);
    for (i=0; i<4 && s<ea; ++i, s+=halfPi$2) update(s);
  }

  add$3(cx + xmin, cy + ymin);
  add$3(cx + xmax, cy + ymax);
};

function gradient(context, gradient, bounds) {
  var w = bounds.width(),
      h = bounds.height(),
      x1 = bounds.x1 + gradient.x1 * w,
      y1 = bounds.y1 + gradient.y1 * h,
      x2 = bounds.x1 + gradient.x2 * w,
      y2 = bounds.y1 + gradient.y2 * h,
      stop = gradient.stops,
      i = 0,
      n = stop.length,
      linearGradient = context.createLinearGradient(x1, y1, x2, y2);

  for (; i<n; ++i) {
    linearGradient.addColorStop(stop[i].offset, stop[i].color);
  }

  return linearGradient;
}

function color$1(context, item, value) {
  return (value.id) ?
    gradient(context, value, item.bounds) :
    value;
}

function fill(context, item, opacity) {
  opacity *= (item.fillOpacity==null ? 1 : item.fillOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.fillStyle = color$1(context, item, item.fill);
    return true;
  } else {
    return false;
  }
}

var Empty$1 = [];

function stroke(context, item, opacity) {
  var lw = (lw = item.strokeWidth) != null ? lw : 1, lc;
  if (lw <= 0) return false;

  opacity *= (item.strokeOpacity==null ? 1 : item.strokeOpacity);
  if (opacity > 0) {
    context.globalAlpha = opacity;
    context.strokeStyle = color$1(context, item, item.stroke);
    context.lineWidth = lw;
    context.lineCap = (lc = item.strokeCap) != null ? lc : 'butt';
    if (context.setLineDash) {
      context.setLineDash(item.strokeDash || Empty$1);
      context.lineDashOffset = item.strokeDashOffset || 0;
    }
    return true;
  } else {
    return false;
  }
}

function compare$1(a, b) {
  return a.zindex - b.zindex || a.index - b.index;
}

function zorder(scene) {
  if (!scene.zdirty) return scene.zitems;

  var items = scene.items,
      output = [], item, i, n;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    item.index = i;
    if (item.zindex) output.push(item);
  }

  scene.zdirty = false;
  return scene.zitems = output.sort(compare$1);
}

function visit(scene, visitor) {
  var items = scene.items, i, n;
  if (!items || !items.length) return;

  var zitems = zorder(scene);

  if (zitems && zitems.length) {
    for (i=0, n=items.length; i<n; ++i) {
      if (!items[i].zindex) visitor(items[i]);
    }
    items = zitems;
  }

  for (i=0, n=items.length; i<n; ++i) {
    visitor(items[i]);
  }
}

function pickVisit(scene, visitor) {
  var items = scene.items, hit, i;
  if (!items || !items.length) return null;

  var zitems = zorder(scene);
  if (zitems && zitems.length) items = zitems;

  for (i=items.length; --i >= 0;) {
    if (hit = visitor(items[i])) return hit;
  }

  if (items === zitems) {
    for (items=scene.items, i=items.length; --i >= 0;) {
      if (!items[i].zindex) {
        if (hit = visitor(items[i])) return hit;
      }
    }
  }

  return null;
}

function drawAll(path) {
  return function(context, scene, bounds) {
    visit(scene, function(item) {
      if (!bounds || bounds.intersects(item.bounds)) {
        drawPath(path, context, item, item);
      }
    });
  };
}

function drawOne(path) {
  return function(context, scene, bounds) {
    if (scene.items.length && (!bounds || bounds.intersects(scene.bounds))) {
      drawPath(path, context, scene.items[0], scene.items);
    }
  };
}

function drawPath(path, context, item, items) {
  var opacity = item.opacity == null ? 1 : item.opacity;
  if (opacity === 0) return;

  if (path(context, items)) return;

  if (item.fill && fill(context, item, opacity)) {
    context.fill();
  }

  if (item.stroke && stroke(context, item, opacity)) {
    context.stroke();
  }
}

var trueFunc = function() { return true; };

function pick(test) {
  if (!test) test = trueFunc;

  return function(context, scene, x, y, gx, gy) {
    if (context.pixelRatio > 1) {
      x *= context.pixelRatio;
      y *= context.pixelRatio;
    }

    return pickVisit(scene, function(item) {
      var b = item.bounds;
      // first hit test against bounding box
      if ((b && !b.contains(gx, gy)) || !b) return;
      // if in bounding box, perform more careful test
      if (test(context, item, x, y, gx, gy)) return item;
    });
  };
}

function hitPath(path, filled) {
  return function(context, o, x, y) {
    var item = Array.isArray(o) ? o[0] : o,
        fill = (filled == null) ? item.fill : filled,
        stroke = item.stroke && context.isPointInStroke, lw, lc;

    if (stroke) {
      lw = item.strokeWidth;
      lc = item.strokeCap;
      context.lineWidth = lw != null ? lw : 1;
      context.lineCap   = lc != null ? lc : 'butt';
    }

    return path(context, o) ? false :
      (fill && context.isPointInPath(x, y)) ||
      (stroke && context.isPointInStroke(x, y));
  };
}

function pickPath(path) {
  return pick(hitPath(path));
}

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

function translateItem(item) {
  return translate(item.x || 0, item.y || 0);
}

var cache$2 = {};

function color$2(context, item, value) {
  if (value.id) {
    // TODO: support gradients
    return [1.0, 1.0, 1.0];
  }
  if (cache$2[value]) {
    return cache$2[value];
  }
  var rgb = color(value).rgb();
  cache$2[value] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  return cache$2[value];
}

function fill$1(context, item, opacity, count) {
  var i, c, tc = context._triangleColor;
  opacity *= (item.fillOpacity==null ? 1 : item.fillOpacity);
  // TODO: don't special-case 'transparent'
  if (opacity > 0 && item.fill !== 'transparent') {
    c = color$2(context, item, item.fill);
    for (i = 0; i < count * 3; i++) {
      tc.push(c[0], c[1], c[2], opacity);
    }
    return true;
  } else {
    return false;
  }
}

var __moduleExports$10 = function numtype(num, def) {
	return typeof num === 'number'
		? num 
		: (typeof def === 'number' ? def : 0)
}

var __moduleExports$12 = copy$3

/**
 * Copy the values from one vec2 to another
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the source vector
 * @returns {vec2} out
 */
function copy$3(out, a) {
    out[0] = a[0]
    out[1] = a[1]
    return out
}

var __moduleExports$13 = scaleAndAdd

/**
 * Adds two vec2's after scaling the second operand by a scalar value
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @param {Number} scale the amount to scale b by before adding
 * @returns {vec2} out
 */
function scaleAndAdd(out, a, b, scale) {
    out[0] = a[0] + (b[0] * scale)
    out[1] = a[1] + (b[1] * scale)
    return out
}

var __moduleExports$14 = dot

/**
 * Calculates the dot product of two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} dot product of a and b
 */
function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1]
}

function clone$1(arr) {
    return [arr[0], arr[1]]
}

function create$3() {
    return [0, 0]
}

var __moduleExports$11 = {
    create: create$3,
    clone: clone$1,
    copy: __moduleExports$12,
    scaleAndAdd: __moduleExports$13,
    dot: __moduleExports$14
}

var __moduleExports$16 = add$5

/**
 * Adds two vec2's
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function add$5(out, a, b) {
    out[0] = a[0] + b[0]
    out[1] = a[1] + b[1]
    return out
}

var __moduleExports$17 = set$5

/**
 * Set the components of a vec2 to the given values
 *
 * @param {vec2} out the receiving vector
 * @param {Number} x X component
 * @param {Number} y Y component
 * @returns {vec2} out
 */
function set$5(out, x, y) {
    out[0] = x
    out[1] = y
    return out
}

var __moduleExports$18 = normalize$2

/**
 * Normalize a vec2
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a vector to normalize
 * @returns {vec2} out
 */
function normalize$2(out, a) {
    var x = a[0],
        y = a[1]
    var len = x*x + y*y
    if (len > 0) {
        //TODO: evaluate use of glm_invsqrt here?
        len = 1 / Math.sqrt(len)
        out[0] = a[0] * len
        out[1] = a[1] * len
    }
    return out
}

var __moduleExports$19 = subtract$1

/**
 * Subtracts vector b from vector a
 *
 * @param {vec2} out the receiving vector
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {vec2} out
 */
function subtract$1(out, a, b) {
    out[0] = a[0] - b[0]
    out[1] = a[1] - b[1]
    return out
}

var add$4 = __moduleExports$16
var set$4 = __moduleExports$17
var normalize$1 = __moduleExports$18
var subtract = __moduleExports$19
var dot$1 = __moduleExports$14

var tmp$1 = [0, 0]

var computeMiter$1 = function computeMiter(tangent, miter, lineA, lineB, halfThick) {
    //get tangent line
    add$4(tangent, lineA, lineB)
    normalize$1(tangent, tangent)

    //get miter as a unit vector
    set$4(miter, -tangent[1], tangent[0])
    set$4(tmp$1, -lineA[1], lineA[0])

    //get the necessary length of our miter
    return halfThick / dot$1(miter, tmp$1)
}

var normal$1 = function normal(out, dir) {
    //get perpendicular
    set$4(out, -dir[1], dir[0])
    return out
}

var direction$1 = function direction(out, a, b) {
    //get unit dir of two lines
    subtract(out, a, b)
    normalize$1(out, out)
    return out
}

var __moduleExports$15 = {
	computeMiter: computeMiter$1,
	normal: normal$1,
	direction: direction$1
};

var number$5 = __moduleExports$10
var vec = __moduleExports$11

var tmp = vec.create()
var capEnd = vec.create()
var lineA = vec.create()
var lineB = vec.create()
var tangent = vec.create()
var miter = vec.create()

var util = __moduleExports$15
var computeMiter = util.computeMiter;
var normal = util.normal;
var direction = util.direction;
function Stroke(opt) {
    if (!(this instanceof Stroke))
        return new Stroke(opt)
    opt = opt||{}
    this.miterLimit = number$5(opt.miterLimit, 10)
    this.thickness = number$5(opt.thickness, 1)
    this.join = opt.join || 'miter'
    this.cap = opt.cap || 'butt'
    this.closed = opt.closed || false
    this._normal = null
    this._lastFlip = -1
    this._started = false
}

Stroke.prototype.mapThickness = function(point, i, points) {
    return this.thickness
}

Stroke.prototype.build = function(points) {
    var complex = {
        positions: [],
        cells: []
    }

    if (points.length <= 1)
        return complex

    if (points.length > 2 && this.closed) {
        var npoints = [points[points.length - 2]];
        Array.prototype.push.apply(npoints, points);
        npoints.push(points[0]);
        points = npoints;
    }

    var total = points.length

    //clear flags
    this._lastFlip = -1
    this._started = false
    this._normal = null

    //join each segment
    for (var i=1, count=0; i<total; i++) {
        var last = points[i-1]
        var cur = points[i]
        var next = i<points.length-1 ? points[i+1] : null
        var thickness = this.mapThickness(cur, i, points)
        var amt = this._seg(complex, count, last, cur, next, thickness/2)
        count += amt
    }
    return complex
}

Stroke.prototype._seg = function(complex, index, last, cur, next, halfThick) {
    var count = 0
    var cells = complex.cells
    var positions = complex.positions
    var capSquare = this.cap === 'square'
    var joinBevel = this.join === 'bevel'

    //get unit direction of line
    direction(lineA, cur, last)

    //if we don't yet have a normal from previous join,
    //compute based on line start - end
    if (!this._normal) {
        this._normal = vec.create()
        normal(this._normal, lineA)
    }

    //if we haven't started yet, add the first two points
    if (!this._started) {
        this._started = true

        //if the end cap is type square, we can just push the verts out a bit
        if (capSquare) {
            vec.scaleAndAdd(capEnd, last, lineA, -halfThick)
            last = capEnd
        }

        extrusions(positions, last, this._normal, halfThick)
    }

    cells.push([index+0, index+1, index+2])

    /*
    // now determine the type of join with next segment

    - round (TODO)
    - bevel
    - miter
    - none (i.e. no next segment, use normal)
     */

    if (!next) { //no next segment, simple extrusion
        //now reset normal to finish cap
        normal(this._normal, lineA)

        //push square end cap out a bit
        if (capSquare) {
            vec.scaleAndAdd(capEnd, cur, lineA, halfThick)
            cur = capEnd
        }

        extrusions(positions, cur, this._normal, halfThick)
        cells.push(this._lastFlip===1 ? [index, index+2, index+3] : [index+2, index+1, index+3])

        count += 2
     } else { //we have a next segment, start with miter
        //get unit dir of next line
        direction(lineB, next, cur)

        //stores tangent & miter
        var miterLen = computeMiter(tangent, miter, lineA, lineB, halfThick)

        // normal(tmp, lineA)

        //get orientation
        var flip = (vec.dot(tangent, this._normal) < 0) ? -1 : 1

        var bevel = joinBevel
        if (!bevel && this.join === 'miter') {
            var limit = miterLen / (halfThick)
            if (limit > this.miterLimit)
                bevel = true
        }

        if (bevel) {
            //next two points in our first segment
            vec.scaleAndAdd(tmp, cur, this._normal, -halfThick * flip)
            positions.push(vec.clone(tmp))
            vec.scaleAndAdd(tmp, cur, miter, miterLen * flip)
            positions.push(vec.clone(tmp))


            cells.push(this._lastFlip!==-flip
                    ? [index, index+2, index+3]
                    : [index+2, index+1, index+3])

            //now add the bevel triangle
            cells.push([index+2, index+3, index+4])

            normal(tmp, lineB)
            vec.copy(this._normal, tmp) //store normal for next round

            vec.scaleAndAdd(tmp, cur, tmp, -halfThick*flip)
            positions.push(vec.clone(tmp))

            // //the miter is now the normal for our next join
            count += 3
        } else { //miter
            //next two points for our miter join
            extrusions(positions, cur, miter, miterLen)
            cells.push(this._lastFlip===1
                    ? [index, index+2, index+3]
                    : [index+2, index+1, index+3])

            flip = -1

            //the miter is now the normal for our next join
            vec.copy(this._normal, miter)
            count += 2
        }
        this._lastFlip = flip
     }
     return count
}

function extrusions(positions, point, normal, scale) {
    //next two points to end our segment
    vec.scaleAndAdd(tmp, point, normal, -scale)
    positions.push(vec.clone(tmp))

    vec.scaleAndAdd(tmp, point, normal, scale)
    positions.push(vec.clone(tmp))
}

var index$6 = Stroke

// TODO: Support line dash and line dash offset

function strokeGL(context, item, opacity, polylines, closed, z) {

  // TODO: Don't have special case for 'transparent'
  opacity *= (item.strokeOpacity==null ? 1 : item.strokeOpacity);
  if (opacity <= 0 || item.stroke === 'transparent') return false;

  var lw = (lw = item.strokeWidth) != null ? lw : 1,
      lc = (lc = item.strokeCap) != null ? lc : 'butt';
  if (lw <= 0) return false;

  var strokeExtrude = index$6({
      thickness: lw,
      cap: lc,
      join: 'miter',
      miterLimit: 10,
      closed: closed
  });

  var c = color$2(context, item, item.stroke);

  for (var li = 0; li < polylines.length; li++) {
    var polyline = polylines[li];
    var mesh = strokeExtrude.build(polyline);
    var mp = mesh.positions,
        mc = mesh.cells,
        mcl = mesh.cells.length,
        tg = context._triangleGeometry,
        tc = context._triangleColor,
        tx = context._tx + context._origin[0],
        ty = context._ty + context._origin[1];
    for (var ci = 0; ci < mcl; ci++) {
      var cell = mc[ci];
      var p1 = mp[cell[0]];
      var p2 = mp[cell[1]];
      var p3 = mp[cell[2]];
      tg.push(p1[0] + tx, p1[1] + ty, z, p2[0] + tx, p2[1] + ty, z, p3[0] + tx, p3[1] + ty, z);
      for (var i = 0; i < 3; i++) {
        tc.push(c[0], c[1], c[2], opacity);
      }
    }
  }

  return true;
}

function drawGeometry(geom, context, item) {
  var opacity = item.opacity == null ? 1 : item.opacity,
      tg = context._triangleGeometry;

  if (opacity <= 0) return;
  if (item.fill && fill$1(context, item, opacity, geom.triangles.length / 9)) {
    var tl = geom.triangles.length,
        t = geom.triangles;
    for (var i = 0; i < tl; i++) {
      tg.push(t[i]);
    }
  }

  if (item.stroke) {
    strokeGL(context, item, opacity, geom.lines, geom.closed, geom.z);
  }
}

function markItemPath(type, shape) {

  function attr(emit, item) {
    emit('transform', translateItem(item));
    emit('d', shape(null, item));
  }

  function bound(bounds, item) {
    shape(context(bounds), item);
    return boundStroke(bounds, item)
      .translate(item.x || 0, item.y || 0);
  }

  function draw(context, item) {
    var x = item.x || 0,
        y = item.y || 0;
    context.translate(x, y);
    context.beginPath();
    shape(context, item);
    context.translate(-x, -y);
  }

  function drawGL(context, scene, bounds) {
    visit(scene, function(item) {
      if (bounds && !bounds.intersects(item.bounds)) return; // bounds check

      var x = item.x || 0,
          y = item.y || 0;

      context._tx += x;
      context._ty += y;

      var geom = shape(context, item);
      drawGeometry(geom, context, item);

      context._tx -= x;
      context._ty -= y;
    });
  }

  return {
    type:   type,
    tag:    'path',
    nested: false,
    attr:   attr,
    bound:  bound,
    draw:   drawAll(draw),
    drawGL: drawGL,
    pick:   pickPath(draw)
  };

}

var arc = markItemPath('arc', arc$1);

function markMultiItemPath(type, shape) {

  function attr(emit, item) {
    var items = item.mark.items;
    if (items.length) emit('d', shape(null, items));
  }

  function bound(bounds, mark) {
    var items = mark.items;
    return items.length === 0 ? bounds
      : (shape(context(bounds), items), boundStroke(bounds, items[0]));
  }

  function draw(context, items) {
    context.beginPath();
    shape(context, items);
  }

  var hit = hitPath(draw);

  function pick(context, scene, x, y, gx, gy) {
    var items = scene.items,
        b = scene.bounds;

    if (!items || !items.length || b && !b.contains(gx, gy)) {
      return null;
    }

    if (context.pixelRatio > 1) {
      x *= context.pixelRatio;
      y *= context.pixelRatio;
    }
    return hit(context, items, x, y) ? items[0] : null;
  }

  function drawGL(context, scene, bounds) {
    if (scene.items.length && (!bounds || bounds.intersects(scene.bounds))) {
      var item = scene.items[0];
      var geom = shape(context, scene.items);
      drawGeometry(geom, context, item);
    }
  }

  return {
    type:   type,
    tag:    'path',
    nested: true,
    attr:   attr,
    bound:  bound,
    draw:   drawOne(draw),
    drawGL: drawGL,
    pick:   pick
  };

}

var area$3 = markMultiItemPath('area', area$1);

function attr(emit, item, renderer) {
  var id = null, defs, c;

  emit('transform', translateItem(item));

  if (item.clip) {
    defs = renderer._defs;
    id = item.clip_id || (item.clip_id = 'clip' + defs.clip_id++);
    c = defs.clipping[id] || (defs.clipping[id] = {id: id});
    c.width = item.width || 0;
    c.height = item.height || 0;
  }

  emit('clip-path', id ? ('url(#' + id + ')') : null);
}

function background(emit, item) {
  var offset = item.stroke ? 0.5 : 0;
  emit('class', 'background');
  emit('d', rectangle(null, item, offset, offset));
}

function bound(bounds, group) {
  if (!group.clip && group.items) {
    var items = group.items;
    for (var j=0, m=items.length; j<m; ++j) {
      bounds.union(items[j].bounds);
    }
  }

  if (group.clip || group.width || group.height) {
    boundStroke(
      bounds.add(0, 0).add(group.width || 0, group.height || 0),
      group
    );
  }

  return bounds.translate(group.x || 0, group.y || 0);
}

function draw(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(group) {
    var gx = group.x || 0,
        gy = group.y || 0,
        w = group.width || 0,
        h = group.height || 0,
        offset, opacity;

    // setup graphics context
    context.save();
    context.translate(gx, gy);

    // draw group background
    if (group.stroke || group.fill) {
      opacity = group.opacity == null ? 1 : group.opacity;
      if (opacity > 0) {
        context.beginPath();
        offset = group.stroke ? 0.5 : 0;
        rectangle(context, group, offset, offset);
        if (group.fill && fill(context, group, opacity)) {
          context.fill();
        }
        if (group.stroke && stroke(context, group, opacity)) {
          context.stroke();
        }
      }
    }

    // set clip and bounds
    if (group.clip) {
      context.beginPath();
      context.rect(0, 0, w, h);
      context.clip();
    }
    if (bounds) bounds.translate(-gx, -gy);

    // draw group contents
    visit(group, function(item) {
      renderer.draw(context, item, bounds);
    });

    // restore graphics context
    if (bounds) bounds.translate(gx, gy);
    context.restore();
  });
}

function pick$1(context, scene, x, y, gx, gy) {
  if (scene.bounds && !scene.bounds.contains(gx, gy) || !scene.items) {
    return null;
  }

  var handler = this;

  return pickVisit(scene, function(group) {
    var hit, dx, dy, b;

    // first hit test against bounding box
    // if a group is clipped, that should be handled by the bounds check.
    b = group.bounds;
    if (b && !b.contains(gx, gy)) return;

    // passed bounds check, so test sub-groups
    dx = (group.x || 0);
    dy = (group.y || 0);

    context.save();
    context.translate(dx, dy);

    dx = gx - dx;
    dy = gy - dy;

    hit = pickVisit(group, function(mark) {
      return (mark.interactive !== false || mark.marktype === 'group')
        ? handler.pick(mark, x, y, dx, dy)
        : null;
    });

    context.restore();
    if (hit) return hit;

    hit = scene.interactive !== false
      && (group.fill || group.stroke)
      && dx >= 0
      && dx <= group.width
      && dy >= 0
      && dy <= group.height;

    return hit ? group : null;
  });
}

function drawGL(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(group) {
    var gx = group.x || 0,
        gy = group.y || 0,
        w = group.width || 0,
        h = group.height || 0,
        offset, opacity;

    // setup graphics context
    context._tx += gx;
    context._ty += gy;
    context._textContext.save();
    context._textContext.translate(gx, gy);

    // draw group background
    if (group.stroke || group.fill) {
      opacity = group.opacity == null ? 1 : group.opacity;
      if (opacity > 0) {
        offset = group.stroke ? 0.5 : 0;
        var geom = rectangle(context, group, offset, offset);
        drawGeometry(geom, context, group);
      }
    }

    // set clip and bounds
    if (group.clip) {
      // TODO: do something here in webgl?
    }
    if (bounds) bounds.translate(-gx, -gy);

    // draw group contents
    visit(group, function(item) {
      renderer.draw(context, item, bounds);
    });

    // restore graphics context
    if (bounds) bounds.translate(gx, gy);

    context._tx -= gx;
    context._ty -= gy;
    context._textContext.restore();
  });
}

var group = {
  type:       'group',
  tag:        'g',
  nested:     false,
  attr:       attr,
  bound:      bound,
  draw:       draw,
  pick:       pick$1,
  background: background,
  drawGL:     drawGL
};

function multiply(a, b) {
  var ind = [
    0,0,4,1,8,2,12,3,
    1,0,5,1,9,2,13,3,
    2,0,6,1,10,2,14,3,
    3,0,7,1,11,2,15,3,
    0,4,4,5,8,6,12,7,
    1,4,5,5,9,6,13,7,
    2,4,6,5,10,6,14,7,
    3,4,7,5,11,6,15,7,
    0,8,4,9,8,10,12,11,
    1,8,5,9,9,10,13,11,
    2,8,6,9,10,10,14,11,
    3,8,7,9,11,10,15,11,
    0,12,4,13,8,14,12,15,
    1,12,5,13,9,14,13,15,
    2,12,6,13,10,14,14,15,
    3,12,7,13,11,14,15,15
  ];
  var c = [
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0,
    0, 0, 0, 0
  ];
  for (var i = 0; i < ind.length/2; i++) {
    c[Math.floor(i/4)] += a[ind[2*i]] * b[ind[2*i+1]];
  }
  return c;
}

function perspective(fieldOfViewInRadians, aspect, near, far) {
  var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
  var rangeInv = 1.0 / (near - far);

  return [
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (near + far) * rangeInv, -1,
    0, 0, near * far * rangeInv * 2, 0
  ];
}

function rotateX(a) {
  return [
    1, 0, 0, 0,
    0, Math.cos(a), Math.sin(a), 0,
    0, -Math.sin(a), Math.cos(a), 0,
    0, 0, 0, 1
  ];
}

function rotateY(a) {
  return [
    Math.cos(a), 0, -Math.sin(a), 0,
    0, 1, 0, 0,
    Math.sin(a), 0, Math.cos(a), 0,
    0, 0, 0, 1
  ];
}

function rotateZ(a) {
  return [
    Math.cos(a), Math.sin(a), 0, 0,
    -Math.sin(a), Math.cos(a), 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];
}

function translateGL(x, y, z) {
  return [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ];
}

// Adapted from https://github.com/greggman/webgl-fundamentals
//
// BSD license follows:
//
// Copyright 2012, Gregg Tavares.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Gregg Tavares. nor the names of his
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

// creates a texture info { width: w, height: h, texture: tex }
function loadImageAndCreateTextureInfo(gl, img) {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  // let's assume all images are not a power of 2
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  var textureInfo = {texture: tex};
  textureInfo.width = img.width;
  textureInfo.height = img.height;
  gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return textureInfo;
}

function drawImage(gl, texInfo, matrix) {
  gl.bindTexture(gl.TEXTURE_2D, texInfo.texture);
  gl.useProgram(gl._imageShaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl._imagePositionBuffer);
  gl.enableVertexAttribArray(gl._imagePositionLocation);
  gl.vertexAttribPointer(gl._imagePositionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl._imageTexcoordBuffer);
  gl.enableVertexAttribArray(gl._imageTexcoordLocation);
  gl.vertexAttribPointer(gl._imageTexcoordLocation, 2, gl.FLOAT, false, 0, 0);
  var w = gl.canvas.width / gl._ratio,
      h = gl.canvas.height / gl._ratio;
  var preMatrix = [
    texInfo.w, 0, 0, 0,
    0, texInfo.h, 0, 0,
    0, 0, 1, 0,
    texInfo.x, texInfo.y, 0, 1
  ];
  matrix = multiply(matrix, preMatrix);
  gl.uniformMatrix4fv(gl._imageMatrixLocation, false, matrix);
  gl.uniform1i(gl._imageTextureLocation, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function getImage(item, renderer) {
  var image = item.image;
  if (!image || image.url !== item.url) {
    image = {loaded: false, width: 0, height: 0};
    renderer.loadImage(item.url).then(function(image) {
      item.image = image;
      item.image.url = item.url;
    });
  }
  return image;
}

function imageXOffset(align, w) {
  return align === 'center' ? w / 2 : align === 'right' ? w : 0;
}

function imageYOffset(baseline, h) {
  return baseline === 'middle' ? h / 2 : baseline === 'bottom' ? h : 0;
}

function attr$1(emit, item, renderer) {
  var image = getImage(item, renderer),
      x = item.x || 0,
      y = item.y || 0,
      w = item.width || image.width || 0,
      h = item.height || image.height || 0;

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  emit('href', image.src || '', 'http://www.w3.org/1999/xlink', 'xlink:href');
  emit('transform', translate(x, y));
  emit('width', w);
  emit('height', h);
}

function bound$1(bounds, item) {
  var image = item.image,
      x = item.x || 0,
      y = item.y || 0,
      w = item.width || (image && image.width) || 0,
      h = item.height || (image && image.height) || 0;

  x -= imageXOffset(item.align, w);
  y -= imageYOffset(item.baseline, h);

  return bounds.set(x, y, x + w, y + h);
}

function draw$1(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check

    var image = getImage(item, renderer),
        x = item.x || 0,
        y = item.y || 0,
        w = item.width || image.width || 0,
        h = item.height || image.height || 0,
        opacity;

    x -= imageXOffset(item.align, w);
    y -= imageYOffset(item.baseline, h);

    if (image.loaded) {
      context.globalAlpha = (opacity = item.opacity) != null ? opacity : 1;
      context.drawImage(image, x, y, w, h);
    }
  });
}

function drawGL$1(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check

    var image = getImage(item, renderer),
        x = item.x || 0,
        y = item.y || 0,
        w = item.width || image.width || 0,
        h = item.height || image.height || 0,
        opacity;

    x -= imageXOffset(item.align, w);
    y -= imageYOffset(item.baseline, h);

    if (image.loaded) {
      var imgInfo = loadImageAndCreateTextureInfo(context, image);
      imgInfo.x = x + context._tx + context._origin[0];
      imgInfo.y = y + context._ty + context._origin[1];
      imgInfo.w = w;
      imgInfo.h = h;
      context._images.push(imgInfo);
    }
  });
}

var image = {
  type:   'image',
  tag:    'image',
  nested: false,
  attr:   attr$1,
  bound:  bound$1,
  draw:   draw$1,
  drawGL: drawGL$1,
  pick:   pick()
};

var line$4 = markMultiItemPath('line', line$1);

function attr$2(emit, item) {
  emit('transform', translateItem(item));
  emit('d', item.path);
}

function path$1(context, item) {
  var path = item.path;
  if (path == null) return true;

  var cache = item.pathCache;
  if (!cache || cache.path !== path) {
    (item.pathCache = cache = pathParse(path)).path = path;
  }
  pathRender(context, cache, item.x, item.y);
}

function drawGL$2(context, scene, bounds) {
  visit(scene, function(item) {
    var opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity === 0) return;

    var path = item.path;
    if (path == null) return true;

    var geom = geometryForPath(context, path);

    var x = item.x || 0,
        y = item.y || 0;

    context._tx += x;
    context._ty += y;

    drawGeometry(geom, context, item);

    context._tx -= x;
    context._ty -= y;
  });
}

function bound$2(bounds, item) {
  return path$1(context(bounds), item)
    ? bounds.set(0, 0, 0, 0)
    : boundStroke(bounds, item);
}

var path$2 = {
  type:   'path',
  tag:    'path',
  nested: false,
  attr:   attr$2,
  bound:  bound$2,
  draw:   drawAll(path$1),
  drawGL: drawGL$2,
  pick:   pickPath(path$1)
};

function attr$3(emit, item) {
  emit('d', rectangle(null, item));
}

function bound$3(bounds, item) {
  var x, y;
  return boundStroke(bounds.set(
    x = item.x || 0,
    y = item.y || 0,
    (x + item.width) || 0,
    (y + item.height) || 0
  ), item);
}

function draw$2(context, item) {
  context.beginPath();
  rectangle(context, item);
}

function pathGL(context, item, opacity) {
  var geom = rectangle(context, item);
  drawGeometry(geom, context, item);
  return true;
}

function drawGL$3(context, scene, bounds) {
  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    var opacity = item.opacity == null ? 1 : item.opacity;
    pathGL(context, item, opacity);
  });
}

var rect = {
  type:   'rect',
  tag:    'path',
  nested: false,
  attr:   attr$3,
  bound:  bound$3,
  draw:   drawAll(draw$2),
  drawGL: drawGL$3,
  pick:   pickPath(draw$2)
};

function attr$4(emit, item) {
  emit('transform', translateItem(item));
  emit('x2', item.x2 != null ? item.x2 - (item.x||0) : 0);
  emit('y2', item.y2 != null ? item.y2 - (item.y||0) : 0);
}

function bound$4(bounds, item) {
  var x1, y1;
  return boundStroke(bounds.set(
    x1 = item.x || 0,
    y1 = item.y || 0,
    item.x2 != null ? item.x2 : x1,
    item.y2 != null ? item.y2 : y1
  ), item);
}

function path$3(context, item, opacity) {
  var x1, y1, x2, y2;

  if (item.stroke && stroke(context, item, opacity)) {
    x1 = item.x || 0;
    y1 = item.y || 0;
    x2 = item.x2 != null ? item.x2 : x1;
    y2 = item.y2 != null ? item.y2 : y1;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    return true;
  }
  return false;
}

function draw$3(context, scene, bounds) {
  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    var opacity = item.opacity == null ? 1 : item.opacity;
    if (opacity && path$3(context, item, opacity)) {
      context.stroke();
    }
  });
}

function hit(context, item, x, y) {
  if (!context.isPointInStroke) return false;
  return path$3(context, item, 1) && context.isPointInStroke(x, y);
}

function pathGL$1(context, item, opacity) {
  var x1, y1, x2, y2, line;

  x1 = item.x || 0;
  y1 = item.y || 0;
  x2 = item.x2 != null ? item.x2 : x1;
  y2 = item.y2 != null ? item.y2 : y1;

  line = [[x1, y1], [x2, y2]];

  if (item.stroke && strokeGL(context, item, opacity, [line], false, 0)) {
    return true;
  }
  return false;
}

function drawGL$4(context, scene, bounds) {
  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    var opacity = item.opacity == null ? 1 : item.opacity;
    pathGL$1(context, item, opacity);
  });
}

var rule = {
  type:   'rule',
  tag:    'line',
  nested: false,
  attr:   attr$4,
  bound:  bound$4,
  draw:   draw$3,
  pick:   pick(hit),
  drawGL: drawGL$4
};

var shape$1 = markItemPath('shape', shape);

var symbol$1 = markItemPath('symbol', symbol);

var context$1;

function estimateWidth(item) {
  // make dumb, simple estimate if no canvas is available
  return ~~(0.8 * textValue(item).length * height(item));
}

function measureWidth(item) {
  // measure text width if canvas is available
  context$1.font = font(item);
  return context$1.measureText(textValue(item.text)).width;
}

var width = (context$1 = Canvas$1(1, 1))
  ? (context$1 = context$1.getContext('2d'), measureWidth)
  : estimateWidth;

function height(item) {
  return item.fontSize != null ? item.fontSize : 11;
}

function textValue(s) {
  return s != null ? String(s) : '';
}

function font(item, quote) {
  var font = item.font;
  if (quote && font) {
    font = String(font).replace(/\"/g, '\'');
  }
  return '' +
    (item.fontStyle ? item.fontStyle + ' ' : '') +
    (item.fontVariant ? item.fontVariant + ' ' : '') +
    (item.fontWeight ? item.fontWeight + ' ' : '') +
    height(item) + 'px ' +
    (font || 'sans-serif');
}

function offset(item) {
  // perform our own font baseline calculation
  // why? not all browsers support SVG 1.1 'alignment-baseline' :(
  var baseline = item.baseline,
      h = height(item);
  return Math.round(
    baseline === 'top'    ?  0.93*h :
    baseline === 'middle' ?  0.30*h :
    baseline === 'bottom' ? -0.21*h : 0
  );
}

var textAlign = {
  'left':   'start',
  'center': 'middle',
  'right':  'end'
};

var tempBounds = new Bounds();

function attr$5(emit, item) {
  var dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item),
      x = item.x || 0,
      y = item.y || 0,
      a = item.angle || 0,
      r = item.radius || 0, t;

  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  emit('text-anchor', textAlign[item.align] || 'start');

  if (a) {
    t = translate(x, y) + ' rotate('+a+')';
    if (dx || dy) t += ' ' + translate(dx, dy);
  } else {
    t = translate(x + dx, y + dy);
  }
  emit('transform', t);
}

function bound$5(bounds, item, noRotate) {
  var h = height(item),
      a = item.align,
      r = item.radius || 0,
      x = item.x || 0,
      y = item.y || 0,
      dx = item.dx || 0,
      dy = (item.dy || 0) + offset(item) - Math.round(0.8*h), // use 4/5 offset
      w, t;

  if (r) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  // horizontal alignment
  w = width(item);
  if (a === 'center') {
    dx -= (w / 2);
  } else if (a === 'right') {
    dx -= w;
  } else {
    // left by default, do nothing
  }

  bounds.set(dx+=x, dy+=y, dx+w, dy+h);
  if (item.angle && !noRotate) {
    bounds.rotate(item.angle*Math.PI/180, x, y);
  }
  return bounds.expand(noRotate ? 0 : 1);
}

function drawText(context, item, bounds) {
  var opacity, x, y, r, t, str;
  if (bounds && !bounds.intersects(item.bounds)) return false; // bounds check
  if (!(str = textValue(item.text))) return false; // get text string

  opacity = item.opacity == null ? 1 : item.opacity;
  if (opacity === 0) return false;

  context.font = font(item);
  context.textAlign = item.align || 'left';

  x = item.x || 0;
  y = item.y || 0;
  if ((r = item.radius)) {
    t = (item.theta || 0) - Math.PI/2;
    x += r * Math.cos(t);
    y += r * Math.sin(t);
  }

  if (item.angle) {
    context.save();
    context.translate(x, y);
    context.rotate(item.angle * Math.PI/180);
    x = y = 0; // reset x, y
  }
  x += (item.dx || 0);
  y += (item.dy || 0) + offset(item);

  if (item.fill && fill(context, item, opacity)) {
    context.fillText(str, x, y);
  }
  if (item.stroke && stroke(context, item, opacity)) {
    context.strokeText(str, x, y);
  }
  if (item.angle) context.restore();
  return true;
}

function draw$4(context, scene, bounds) {
  visit(scene, function(item) {
    drawText(context, item, bounds);
  });
}

function drawGL$5(context, scene, bounds) {
  visit(scene, function(item) {
    drawText(context._textContext, item, bounds);
  });
}

function hit$1(context, item, x, y, gx, gy) {
  if (item.fontSize <= 0) return false;
  if (!item.angle) return true; // bounds sufficient if no rotation

  // project point into space of unrotated bounds
  var b = bound$5(tempBounds, item, true),
      a = -item.angle * Math.PI / 180,
      cos = Math.cos(a),
      sin = Math.sin(a),
      ix = item.x,
      iy = item.y,
      px = cos*gx - sin*gy + (ix - ix*cos + iy*sin),
      py = sin*gx + cos*gy + (iy - ix*sin - iy*cos);

  return b.contains(px, py);
}

var text$1 = {
  type:   'text',
  tag:    'text',
  nested: false,
  attr:   attr$5,
  bound:  bound$5,
  draw:   draw$4,
  drawGL: drawGL$5,
  pick:   pick(hit$1)
};

var marks = {
  arc:     arc,
  area:    area$3,
  group:   group,
  image:   image,
  line:    line$4,
  path:    path$2,
  rect:    rect,
  rule:    rule,
  shape:   shape$1,
  symbol:  symbol$1,
  text:    text$1
};

function point$6(event, el) {
  var rect = el.getBoundingClientRect();
  return [
    event.clientX - rect.left - (el.clientLeft || 0),
    event.clientY - rect.top - (el.clientTop || 0)
  ];
}

// create a new DOM element
function create$4(doc, tag, ns) {
  return ns ? doc.createElementNS(ns, tag) : doc.createElement(tag);
}

// find first child element with matching tag
function find$1(el, tag) {
  tag = tag.toLowerCase();
  var nodes = el.childNodes, i = 0, n = nodes.length;
  for (; i<n; ++i) if (nodes[i].tagName.toLowerCase() === tag) {
    return nodes[i];
  }
}

// retrieve child element at given index
// create & insert if doesn't exist or if tags do not match
function child(el, index, tag, ns) {
  var a = el.childNodes[index], b;
  if (!a || a.tagName.toLowerCase() !== tag.toLowerCase()) {
    b = a || null;
    a = create$4(el.ownerDocument, tag, ns);
    el.insertBefore(a, b);
  }
  return a;
}

// remove all child elements at or above the given index
function clear(el, index) {
  var nodes = el.childNodes,
      curr = nodes.length;
  while (curr > index) el.removeChild(nodes[--curr]);
  return el;
}

// generate css class name for mark
function cssClass(mark) {
  return 'mark-' + mark.marktype + (mark.name ? ' '+mark.name : '');
}

function CanvasHandler() {
  Handler.call(this);
  this._down = null;
  this._touch = null;
  this._first = true;
}

var prototype$60 = inherits$1(CanvasHandler, Handler);

prototype$60.initialize = function(el, origin, obj) {
  // add event listeners
  var canvas = this._canvas = el && find$1(el, 'canvas');
  if (canvas) {
    var that = this;
    this.events.forEach(function(type) {
      canvas.addEventListener(type, function(evt) {
        if (prototype$60[type]) {
          prototype$60[type].call(that, evt);
        } else {
          that.fire(type, evt);
        }
      });
    });
  }

  return Handler.prototype.initialize.call(this, el, origin, obj);
};

prototype$60.canvas = function() {
  return this._canvas;
};

// retrieve the current canvas context
prototype$60.context = function() {
  return this._canvas.getContext('2d') || this._canvas._textCanvas.getContext('2d');
};

// supported events
prototype$60.events = [
  'keydown',
  'keypress',
  'keyup',
  'dragenter',
  'dragleave',
  'dragover',
  'mousedown',
  'mouseup',
  'mousemove',
  'mouseout',
  'mouseover',
  'click',
  'dblclick',
  'wheel',
  'mousewheel',
  'touchstart',
  'touchmove',
  'touchend'
];

// to keep firefox happy
prototype$60.DOMMouseScroll = function(evt) {
  this.fire('mousewheel', evt);
};

function move(moveEvent, overEvent, outEvent) {
  return function(evt) {
    var a = this._active,
        p = this.pickEvent(evt);

    if (p === a) {
      // active item and picked item are the same
      this.fire(moveEvent, evt); // fire move
    } else {
      // active item and picked item are different
      if (!a || !a.exit) {
        // fire out for prior active item
        // suppress if active item was removed from scene
        this.fire(outEvent, evt);
      }
      this._active = p;          // set new active item
      this.fire(overEvent, evt); // fire over for new active item
      this.fire(moveEvent, evt); // fire move for new active item
    }
  };
}

function inactive(type) {
  return function(evt) {
    this.fire(type, evt);
    this._active = null;
  };
}

prototype$60.mousemove = move('mousemove', 'mouseover', 'mouseout');
prototype$60.dragover  = move('dragover', 'dragenter', 'dragleave');

prototype$60.mouseout  = inactive('mouseout');
prototype$60.dragleave = inactive('dragleave');

prototype$60.mousedown = function(evt) {
  this._down = this._active;
  this.fire('mousedown', evt);
};

prototype$60.click = function(evt) {
  if (this._down === this._active) {
    this.fire('click', evt);
    this._down = null;
  }
};

prototype$60.touchstart = function(evt) {
  this._touch = this.pickEvent(evt.changedTouches[0]);

  if (this._first) {
    this._active = this._touch;
    this._first = false;
  }

  this.fire('touchstart', evt, true);
};

prototype$60.touchmove = function(evt) {
  this.fire('touchmove', evt, true);
};

prototype$60.touchend = function(evt) {
  this.fire('touchend', evt, true);
  this._touch = null;
};

// fire an event
prototype$60.fire = function(type, evt, touch) {
  var a = touch ? this._touch : this._active,
      h = this._handlers[type], i, len;
  if (h) {
    evt.vegaType = type;
    for (i=0, len=h.length; i<len; ++i) {
      h[i].handler.call(this._obj, evt, a);
    }
  }
};

// add an event handler
prototype$60.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers;
  (h[name] || (h[name] = [])).push({
    type: type,
    handler: handler
  });
  return this;
};

// remove an event handler
prototype$60.off = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers[name], i;
  if (!h) return;
  for (i=h.length; --i>=0;) {
    if (h[i].type !== type) continue;
    if (!handler || h[i].handler === handler) h.splice(i, 1);
  }
  return this;
};

prototype$60.pickEvent = function(evt) {
  var p = point$6(evt, this._canvas),
      o = this._origin;
  return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
};

// find the scenegraph item at the current mouse position
// x, y -- the absolute x, y mouse coordinates on the canvas element
// gx, gy -- the relative coordinates within the current group
prototype$60.pick = function(scene, x, y, gx, gy) {
  var g = this.context(),
      mark = marks[scene.marktype];
  return mark.pick.call(this, g, scene, x, y, gx, gy);
};

var devicePixelRatio = typeof window !== 'undefined'
  ? window.devicePixelRatio || 1 : 1;

function resize(canvas, width, height, origin) {
  var scale = typeof HTMLElement !== 'undefined'
    && canvas instanceof HTMLElement
    && canvas.parentNode != null;

  var context = canvas.getContext('2d'),
      ratio = scale ? devicePixelRatio : 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  if (ratio !== 1) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  context.pixelRatio = ratio;
  context.setTransform(
    ratio, 0, 0, ratio,
    ratio * origin[0],
    ratio * origin[1]
  );

  return canvas;
}

function CanvasRenderer(imageLoader) {
  Renderer.call(this, imageLoader);
  this._redraw = false;
}

var prototype$61 = inherits$1(CanvasRenderer, Renderer);
var base = Renderer.prototype;
var tempBounds$1 = new Bounds();
prototype$61.initialize = function(el, width, height, origin) {
  this._canvas = Canvas$1(1, 1); // instantiate a small canvas
  if (el) {
    clear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  // this method will invoke resize to size the canvas appropriately
  return base.initialize.call(this, el, width, height, origin);
};

prototype$61.resize = function(width, height, origin) {
  base.resize.call(this, width, height, origin);
  resize(this._canvas, this._width, this._height, this._origin);
  return this._redraw = true, this;
};

prototype$61.canvas = function() {
  return this._canvas;
};

prototype$61.context = function() {
  return this._canvas ? this._canvas.getContext('2d') : null;
};

function clipToBounds(g, items) {
  var b = new Bounds(), i, n, item, mark, group;
  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;
    group = mark.group;
    item = marks[mark.marktype].nested ? mark : item;
    b.union(translate$1(item.bounds, group));
    if (item.bounds_prev) {
      b.union(translate$1(item.bounds_prev, group));
    }
  }
  b.round();

  g.beginPath();
  g.rect(b.x1, b.y1, b.width(), b.height());
  g.clip();

  return b;
}

function translate$1(bounds, group) {
  if (group == null) return bounds;
  var b = tempBounds$1.clear().union(bounds);
  for (; group != null; group = group.mark.group) {
    b.translate(group.x || 0, group.y || 0);
  }
  return b;
}

prototype$61._render = function(scene, items) {
  var g = this.context(),
      o = this._origin,
      w = this._width,
      h = this._height,
      b;

  // setup
  g.save();
  b = (!items || this._redraw)
    ? (this._redraw = false, null)
    : clipToBounds(g, items);
  this.clear(-o[0], -o[1], w, h);

  // render
  this.draw(g, scene, b);

  // takedown
  g.restore();

  return this;
};

prototype$61.draw = function(ctx, scene, bounds) {
  var mark = marks[scene.marktype];
  mark.draw.call(this, ctx, scene, bounds);
};

prototype$61.clear = function(x, y, w, h) {
  var g = this.context();
  g.clearRect(x, y, w, h);
  if (this._bgcolor != null) {
    g.fillStyle = this._bgcolor;
    g.fillRect(x, y, w, h);
  }
};

function WebGL$1(w, h) {
  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  gl._textCanvas = document.createElement('canvas');
  gl._textCanvas.width = w;
  gl._textCanvas.height = h;
  gl._textContext = gl._textCanvas.getContext('2d');
  canvas._textCanvas = gl._textCanvas;

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.disable(gl.CULL_FACE);

  // Thanks to https://limnu.com/webgl-blending-youre-probably-wrong/
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  var vertCode =
    'attribute vec3 coordinates;' +
    'attribute vec4 color;' +
    'uniform mat4 matrix;' +
    'uniform float zFactor;' +
    'varying vec4 vColor;' +
    'void main(void) {' +
       ' gl_Position = matrix * vec4(coordinates.x, coordinates.y, coordinates.z*zFactor - 1.0, 1.0);' +
       ' vColor = color;' +
    '}';
  var vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(vertShader));
  }

  var fragCode =
    'precision mediump float;' +
    'varying vec4 vColor;' +
    'void main(void) {' +
      ' gl_FragColor = vColor;' +
    '}';
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(fragShader));
  }

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);
  gl._shaderProgram = shaderProgram;
  gl._coordLocation = gl.getAttribLocation(gl._shaderProgram, 'coordinates');
  gl._colorLocation = gl.getAttribLocation(gl._shaderProgram, 'color');
  gl._matrixLocation = gl.getUniformLocation(gl._shaderProgram, 'matrix');
  gl._zFactorLocation = gl.getUniformLocation(gl._shaderProgram, 'zFactor');

// -------------------------------------------------------------------------
// BEGIN: Adapted from https://github.com/greggman/webgl-fundamentals
//
// BSD license follows:
//
// Copyright 2012, Gregg Tavares.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Gregg Tavares. nor the names of his
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

  var vertCode =
    'attribute vec2 a_position;' +
    'attribute vec2 a_texcoord;' +
    'uniform mat4 u_matrix;' +
    'varying vec2 v_texcoord;' +
    'void main() {' +
    '  gl_Position = u_matrix * vec4(a_position, -1.0, 1.0);' +
    '  v_texcoord = a_texcoord;' +
    '}';
  var vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(vertShader));
  }

  var fragCode =
    'precision mediump float;' +
    'varying vec2 v_texcoord;' +
    'uniform sampler2D u_texture;' +
    'void main() {' +
    '  gl_FragColor = texture2D(u_texture, v_texcoord);' +
    '}';
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    console.log(gl.getShaderInfoLog(fragShader));
  }

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  var positions = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  var texcoords = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  gl._imageShaderProgram = shaderProgram;
  gl._imagePositionLocation = gl.getAttribLocation(gl._imageShaderProgram, 'a_position');
  gl._imageTexcoordLocation = gl.getAttribLocation(gl._imageShaderProgram, 'a_texcoord');
  gl._imageMatrixLocation = gl.getUniformLocation(gl._imageShaderProgram, 'u_matrix');
  gl._imageTextureLocation = gl.getUniformLocation(gl._imageShaderProgram, 'u_texture');
  gl._imagePositionBuffer = positionBuffer;
  gl._imageTexcoordBuffer = texcoordBuffer;

// END: Adapted from https://github.com/greggman/webgl-fundamentals
// -------------------------------------------------------------------------

  return canvas;
}

var devicePixelRatio$1 = typeof window !== 'undefined'
  ? window.devicePixelRatio || 1 : 1;

function resize$1(canvas, width, height, origin) {
  var scale = typeof HTMLElement !== 'undefined'
    && canvas instanceof HTMLElement
    && canvas.parentNode != null;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl'),
      ratio = scale ? devicePixelRatio$1 : 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  gl._textCanvas.width = width * ratio;
  gl._textCanvas.height = height * ratio;
  gl._textContext.pixelRatio = ratio;
  gl._textContext.setTransform(
    ratio, 0, 0, ratio,
    ratio * origin[0],
    ratio * origin[1]
  );

  if (ratio !== 1) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  gl.lineWidth(ratio);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl._origin = origin;
  gl._ratio = ratio;

  return canvas;
}

function WebGLRenderer(imageLoader) {
  Renderer.call(this, imageLoader);
  this._redraw = false;
  this._angleX = 0;
  this._angleY = 0;
  this._angleZ = 0;
  this._translateX = 0;
  this._translateY = 0;
  this._translateZ = 0;
  this._zFactor = 0;
  this._depthTest = false;
  this._randomZ = false;
}

var prototype$62 = inherits$1(WebGLRenderer, Renderer);
var base$1 = Renderer.prototype;
var tempBounds$2 = new Bounds();
prototype$62.initialize = function(el, width, height, origin) {
  this._canvas = WebGL$1(1, 1); // instantiate a small canvas
  if (el) {
    clear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  // this method will invoke resize to size the canvas appropriately
  return base$1.initialize.call(this, el, width, height, origin);
};

prototype$62.resize = function(width, height, origin) {
  base$1.resize.call(this, width, height, origin);
  resize$1(this._canvas, this._width, this._height, this._origin);
  return this._redraw = true, this;
};

prototype$62.canvas = function() {
  return this._canvas;
};

prototype$62.context = function() {
  return this._canvas ? (
    this._canvas.getContext('webgl') ||
    this._canvas.getContext('experimental-webgl'))
    : null;
};

prototype$62.rotate = function(x, y, z) {
  this._angleX = x;
  this._angleY = y;
  this._angleZ = z;
  return this;
};

prototype$62.translate = function(x, y, z) {
  this._translateX = x;
  this._translateY = y;
  this._translateZ = z;
  return this;
};

prototype$62.zFactor = function(z) {
  this._zFactor = z;
  return this;
};

prototype$62.depthTest = function(val) {
  this._depthTest = val;
  return this;
};

prototype$62.randomZ = function(val) {
  this._randomZ = val;
  return this;
};

function clipToBounds$1(g, items) {
  // TODO: do something here?
}

prototype$62._render = function(scene, items) {
  var gl = this.context(),
      o = this._origin,
      w = this._width,
      h = this._height,
      b;

  gl._tx = 0;
  gl._ty = 0;
  gl._triangleGeometry = [];
  gl._triangleColor = [];
  gl._images = [];
  gl._randomZ = this._randomZ;

  b = (!items || this._redraw)
    ? (this._redraw = false, null)
    : clipToBounds$1(gl, items);

  this.draw(gl, scene, b);

  var imgInfo = loadImageAndCreateTextureInfo(gl, gl._textCanvas);
  imgInfo.x = 0;
  imgInfo.y = 0;
  imgInfo.w = gl.canvas.width / gl._ratio;
  imgInfo.h = gl.canvas.height / gl._ratio;
  gl._images.push(imgInfo);

  this._triangleBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._triangleBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl._triangleGeometry), gl.STATIC_DRAW);

  this._triangleColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._triangleColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gl._triangleColor), gl.STATIC_DRAW);

  this.frame();

  return this;
};

prototype$62.frame = function() {
  var gl = this.context();

  this.clear();

  gl.useProgram(gl._shaderProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, this._triangleBuffer);
  gl.vertexAttribPointer(gl._coordLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._coordLocation);

  gl.bindBuffer(gl.ARRAY_BUFFER, this._triangleColorBuffer);
  gl.vertexAttribPointer(gl._colorLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._colorLocation);

  var width = gl.canvas.width / gl._ratio;
  var height = gl.canvas.height / gl._ratio;

  var smooshMatrix = [
    2/width, 0, 0, 0,
    0, -2/width, 0, 0,
    0, 0, 1, 0,
    -1, height/width, 0, 1
  ];

  var matrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];

  if (this._depthTest) {
    gl.enable(gl.DEPTH_TEST);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }

  matrix = multiply(matrix, perspective(Math.PI/2, width/height, 0.1, 3000));
  matrix = multiply(matrix, translateGL(this._translateX, this._translateY, (this._translateZ - 1)*height/width));
  matrix = multiply(matrix, rotateZ(this._angleZ));
  matrix = multiply(matrix, rotateY(this._angleY));
  matrix = multiply(matrix, rotateX(this._angleX));
  matrix = multiply(matrix, translateGL(0, 0, 1));
  matrix = multiply(matrix, smooshMatrix);

  gl.uniform1f(gl._zFactorLocation, this._zFactor);
  gl.uniformMatrix4fv(gl._matrixLocation, false, matrix);
  gl.drawArrays(gl.TRIANGLES, 0, gl._triangleGeometry.length / 3);

  gl._images.forEach(function(texInfo) {
    drawImage(gl, texInfo, matrix);
  });

  return this;
};

prototype$62.draw = function(ctx, scene, bounds) {
  var mark = marks[scene.marktype];
  if (mark.drawGL) {
    mark.drawGL.call(this, ctx, scene, bounds);
  }
};

prototype$62.clear = function(x, y, w, h) {
  var gl = this.context(), c;
  if (this._bgcolor != null) {
    c = color$2(gl, null, this._bgcolor);
    gl.clearColor(c[0], c[1], c[2], 1.0);
  } else {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl._textContext.save();
  gl._textContext.setTransform(1, 0, 0, 1, 0, 0);
  gl._textContext.clearRect(0, 0, gl._textCanvas.width, gl._textCanvas.height);
  gl._textContext.restore();
};

function SVGHandler() {
  Handler.call(this);
}

var prototype$63 = inherits$1(SVGHandler, Handler);

prototype$63.initialize = function(el, origin, obj) {
  this._svg = el && find$1(el, 'svg');
  return Handler.prototype.initialize.call(this, el, origin, obj);
};

prototype$63.svg = function() {
  return this._svg;
};

// wrap an event listener for the SVG DOM
prototype$63.listener = function(handler) {
  var that = this;
  return function(evt) {
    var target = evt.target,
        item = target.__data__;
    evt.vegaType = evt.type;
    item = Array.isArray(item) ? item[0] : item;
    handler.call(that._obj, evt, item);
  };
};

// add an event handler
prototype$63.on = function(type, handler) {
  var name = this.eventName(type),
      h = this._handlers,
      x = {
        type:     type,
        handler:  handler,
        listener: this.listener(handler)
      };

  (h[name] || (h[name] = [])).push(x);

  if (this._svg) {
    this._svg.addEventListener(name, x.listener);
  }

  return this;
};

// remove an event handler
prototype$63.off = function(type, handler) {
  var name = this.eventName(type),
      svg = this._svg,
      h = this._handlers[name], i;

  if (!h) return;

  for (i=h.length; --i>=0;) {
    if (h[i].type === type && !handler || h[i].handler === handler) {
      if (this._svg) {
        svg.removeEventListener(name, h[i].listener);
      }
      h.splice(i, 1);
    }
  }

  return this;
};

// generate string for an opening xml tag
// tag: the name of the xml tag
// attr: hash of attribute name-value pairs to include
// raw: additional raw string to include in tag markup
function openTag(tag, attr, raw) {
  var s = '<' + tag, key, val;
  if (attr) {
    for (key in attr) {
      val = attr[key];
      if (val != null) {
        s += ' ' + key + '="' + val + '"';
      }
    }
  }
  if (raw) s += ' ' + raw;
  return s + '>';
}

// generate string for closing xml tag
// tag: the name of the xml tag
function closeTag(tag) {
  return '</' + tag + '>';
}

var metadata = {
  'version': '1.1',
  'xmlns': 'http://www.w3.org/2000/svg',
  'xmlns:xlink': 'http://www.w3.org/1999/xlink'
};

var styles = {
  'fill':             'fill',
  'fillOpacity':      'fill-opacity',
  'stroke':           'stroke',
  'strokeWidth':      'stroke-width',
  'strokeOpacity':    'stroke-opacity',
  'strokeCap':        'stroke-linecap',
  'strokeDash':       'stroke-dasharray',
  'strokeDashOffset': 'stroke-dashoffset',
  'opacity':          'opacity'
};

var styleProperties = Object.keys(styles);

var ns = metadata.xmlns;

function SVGRenderer(imageLoader) {
  Renderer.call(this, imageLoader);
  this._dirtyID = 0;
  this._svg = null;
  this._root = null;
  this._defs = null;
}

var prototype$64 = inherits$1(SVGRenderer, Renderer);
var base$2 = Renderer.prototype;

prototype$64.initialize = function(el, width, height, padding) {
  if (el) {
    this._svg = child(el, 0, 'svg', ns);
    this._svg.setAttribute('class', 'marks');
    clear(el, 1);
    // set the svg root group
    this._root = child(this._svg, 0, 'g', ns);
    clear(this._svg, 1);
  }

  // create the svg definitions cache
  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };

  // set background color if defined
  this.background(this._bgcolor);

  return base$2.initialize.call(this, el, width, height, padding);
};

prototype$64.background = function(bgcolor) {
  if (arguments.length && this._svg) {
    this._svg.style.setProperty('background-color', bgcolor);
  }
  return base$2.background.apply(this, arguments);
};

prototype$64.resize = function(width, height, origin) {
  base$2.resize.call(this, width, height, origin);

  if (this._svg) {
    this._svg.setAttribute('width', this._width);
    this._svg.setAttribute('height', this._height);
    this._root.setAttribute('transform', 'translate(' + this._origin + ')');
  }

  return this;
};

prototype$64.svg = function() {
  if (!this._svg) return null;

  var attr = {
    'class':  'marks',
    'width':  this._width,
    'height': this._height
  };
  for (var key in metadata) {
    attr[key] = metadata[key];
  }

  return openTag('svg', attr) + this._svg.innerHTML + closeTag('svg');
};


// -- Render entry point --

prototype$64._render = function(scene, items) {
  // perform spot updates and re-render markup
  if (this._dirtyCheck(items)) {
    if (this._dirtyAll) this._resetDefs();
    this.draw(this._root, scene);
    clear(this._root, 1);
  }

  this.updateDefs();
  return this;
};

// -- Manage SVG definitions ('defs') block --

prototype$64.updateDefs = function() {
  var svg = this._svg,
      defs = this._defs,
      el = defs.el,
      index = 0, id;

  for (id in defs.gradient) {
    if (!el) defs.el = (el = child(svg, 0, 'defs', ns));
    updateGradient(el, defs.gradient[id], index++);
  }

  for (id in defs.clipping) {
    if (!el) defs.el = (el = child(svg, 0, 'defs', ns));
    updateClipping(el, defs.clipping[id], index++);
  }

  // clean-up
  if (el) {
    if (index === 0) {
      svg.removeChild(el);
      defs.el = null;
    } else {
      clear(el, index);
    }
  }
};

function updateGradient(el, grad, index) {
  var i, n, stop;

  el = child(el, index, 'linearGradient', ns);
  el.setAttribute('id', grad.id);
  el.setAttribute('x1', grad.x1);
  el.setAttribute('x2', grad.x2);
  el.setAttribute('y1', grad.y1);
  el.setAttribute('y2', grad.y2);

  for (i=0, n=grad.stops.length; i<n; ++i) {
    stop = child(el, i, 'stop', ns);
    stop.setAttribute('offset', grad.stops[i].offset);
    stop.setAttribute('stop-color', grad.stops[i].color);
  }
  clear(el, i);
}

function updateClipping(el, clip, index) {
  var rect;

  el = child(el, index, 'clipPath', ns);
  el.setAttribute('id', clip.id);
  rect = child(el, 0, 'rect', ns);
  rect.setAttribute('x', 0);
  rect.setAttribute('y', 0);
  rect.setAttribute('width', clip.width);
  rect.setAttribute('height', clip.height);
}

prototype$64._resetDefs = function() {
  var def = this._defs;
  def.clip_id = 1;
  def.gradient = {};
  def.clipping = {};
};


// -- Manage rendering of items marked as dirty --

prototype$64.isDirty = function(item) {
  return this._dirtyAll
    || !item._svg
    || item.dirty === this._dirtyID;
};

prototype$64._dirtyCheck = function(items) {
  this._dirtyAll = true;
  if (!items) return true;

  var id = ++this._dirtyID,
      item, mark, type, mdef, i, n, o;

  for (i=0, n=items.length; i<n; ++i) {
    item = items[i];
    mark = item.mark;

    if (mark.marktype !== type) {
      // memoize mark instance lookup
      type = mark.marktype;
      mdef = marks[type];
    }

    if (mark.zdirty && mark.dirty !== id) {
      this._dirtyAll = false;
      mark.dirty = id;
      dirtyParents(mark.group, id);
    }

    if (item.exit) { // EXIT
      if (mdef.nested && mark.items.length) {
        // if nested mark with remaining points, update instead
        o = mark.items[0];
        if (o._svg) this._update(mdef, o._svg, o);
      } else if (item._svg) {
        // otherwise remove from DOM
        item._svg.remove();
      }
      item._svg = null;
      continue;
    }

    item = (mdef.nested ? mark.items[0] : item);
    if (item._update === id) continue; // already visited

    if (!item._svg || !item._svg.ownerSVGElement) {
      // ENTER
      this._dirtyAll = false;
      dirtyParents(item, id);
    } else {
      // IN-PLACE UPDATE
      this._update(mdef, item._svg, item);
    }
    item._update = id;
  }
  return !this._dirtyAll;
};

function dirtyParents(item, id) {
  for (; item && item.dirty !== id; item=item.mark.group) {
    item.dirty = id;
    if (item.mark && item.mark.dirty !== id) {
      item.mark.dirty = id;
    } else return;
  }
}


// -- Construct & maintain scenegraph to SVG mapping ---

// Draw a mark container.
prototype$64.draw = function(el, scene, prev) {
  if (!this.isDirty(scene)) return scene._svg;

  var renderer = this,
      mdef = marks[scene.marktype],
      events = scene.interactive === false ? 'none' : null,
      isGroup = mdef.tag === 'g',
      sibling = null,
      i = 0,
      parent;

  parent = bind(scene, el, prev, 'g');
  parent.setAttribute('class', cssClass(scene));
  if (!isGroup && events) {
    parent.style.setProperty('pointer-events', events);
  }

  function process(item) {
    var dirty = renderer.isDirty(item),
        node = bind(item, parent, sibling, mdef.tag);

    if (dirty) {
      renderer._update(mdef, node, item);
      if (isGroup) recurse(renderer, node, item);
    }

    sibling = node;
    ++i;
  }

  if (mdef.nested) {
    if (scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }

  clear(parent, i);
  return parent;
};

// Recursively process group contents.
function recurse(renderer, el, group) {
  var prev = el.firstChild, // group background
      idx = 0;

  visit(group, function(item) {
    prev = renderer.draw(el, item, prev);
    ++idx;
  });

  // remove any extraneous DOM elements
  clear(el, 1 + idx);
}

// Bind a scenegraph item to an SVG DOM element.
// Create new SVG elements as needed.
function bind(item, el, sibling, tag) {
  var node = item._svg, doc;

  // create a new dom node if needed
  if (!node) {
    doc = el.ownerDocument;
    node = create$4(doc, tag, ns);
    item._svg = node;

    if (item.mark) {
      node.__data__ = item;
      node.__values__ = {fill: 'default'};

      // create background element
      if (tag === 'g') {
        var bg = create$4(doc, 'path', ns);
        bg.setAttribute('class', 'background');
        node.appendChild(bg);
        bg.__data__ = item;
      }
    }
  }

  if (doc || node.previousSibling !== sibling) {
    el.insertBefore(node, sibling ? sibling.nextSibling : el.firstChild);
  }

  return node;
}


// -- Set attributes & styles on SVG elements ---

var element = null;
var values$1 = null;
// temp var for current values hash

// Extra configuration for certain mark types
var mark_extras = {
  group: function(mdef, el, item) {
    element = el.childNodes[0];
    values$1 = el.__values__; // use parent's values hash
    mdef.background(emit, item, this);

    var value = item.mark.interactive === false ? 'none' : null;
    if (value !== values$1.events) {
      element.style.setProperty('pointer-events', value);
      values$1.events = value;
    }
  },
  text: function(mdef, el, item) {
    var str = textValue(item.text);
    if (str !== values$1.text) {
      el.textContent = str;
      values$1.text = str;
    }
    str = font(item);
    if (str !== values$1.font) {
      el.style.setProperty('font', str);
      values$1.font = str;
    }
  }
};

prototype$64._update = function(mdef, el, item) {
  // set dom element and values cache
  // provides access to emit method
  element = el;
  values$1 = el.__values__;

  // apply svg attributes
  mdef.attr(emit, item, this);

  // some marks need special treatment
  var extra = mark_extras[mdef.type];
  if (extra) extra(mdef, el, item);

  // apply svg css styles
  // note: element may be modified by 'extra' method
  this.style(element, item);
};

function emit(name, value, ns) {
  // early exit if value is unchanged
  if (value === values$1[name]) return;

  if (value != null) {
    // if value is provided, update DOM attribute
    if (ns) {
      element.setAttributeNS(ns, name, value);
    } else {
      element.setAttribute(name, value);
    }
  } else {
    // else remove DOM attribute
    if (ns) {
      element.removeAttributeNS(ns, name);
    } else {
      element.removeAttribute(name);
    }
  }

  // note current value for future comparison
  values$1[name] = value;
}

prototype$64.style = function(el, o) {
  if (o == null) return;
  var i, n, prop, name, value;

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    value = o[prop];
    if (value === values$1[prop]) continue;

    name = styles[prop];
    if (value == null) {
      if (name === 'fill') {
        el.style.setProperty(name, 'none');
      } else {
        el.style.removeProperty(name);
      }
    } else {
      if (value.id) {
        // ensure definition is included
        this._defs.gradient[value.id] = value;
        value = 'url(' + href() + '#' + value.id + ')';
      }
      el.style.setProperty(name, value+'');
    }

    values$1[prop] = value;
  }
};

function href() {
  return typeof window !== 'undefined' ? window.location.href : '';
}

function SVGStringRenderer(imageLoader) {
  Renderer.call(this, imageLoader);

  this._text = {
    head: '',
    root: '',
    foot: '',
    defs: '',
    body: ''
  };

  this._defs = {
    clip_id:  1,
    gradient: {},
    clipping: {}
  };
}

var prototype$65 = inherits$1(SVGStringRenderer, Renderer);
var base$3 = Renderer.prototype;

prototype$65.resize = function(width, height, origin) {
  base$3.resize.call(this, width, height, origin);
  var o = this._origin,
      t = this._text;

  var attr = {
    'class':  'marks',
    'width':  this._width,
    'height': this._height
  };
  for (var key in metadata) {
    attr[key] = metadata[key];
  }

  t.head = openTag('svg', attr);
  t.root = openTag('g', {
    transform: 'translate(' + o + ')'
  });
  t.foot = closeTag('g') + closeTag('svg');

  return this;
};

prototype$65.svg = function() {
  var t = this._text;
  return t.head + t.defs + t.root + t.body + t.foot;
};

prototype$65._render = function(scene) {
  this._text.body = this.mark(scene);
  this._text.defs = this.buildDefs();
  return this;
};

prototype$65.reset = function() {
  this._defs.clip_id = 0;
  return this;
};

prototype$65.buildDefs = function() {
  var all = this._defs,
      defs = '',
      i, id, def, stops;

  for (id in all.gradient) {
    def = all.gradient[id];
    stops = def.stops;

    defs += openTag('linearGradient', {
      id: id,
      x1: def.x1,
      x2: def.x2,
      y1: def.y1,
      y2: def.y2
    });

    for (i=0; i<stops.length; ++i) {
      defs += openTag('stop', {
        offset: stops[i].offset,
        'stop-color': stops[i].color
      }) + closeTag('stop');
    }

    defs += closeTag('linearGradient');
  }

  for (id in all.clipping) {
    def = all.clipping[id];

    defs += openTag('clipPath', {id: id});

    defs += openTag('rect', {
      x: 0,
      y: 0,
      width: def.width,
      height: def.height
    }) + closeTag('rect');

    defs += closeTag('clipPath');
  }

  return (defs.length > 0) ? openTag('defs') + defs + closeTag('defs') : '';
};

var object$3;

function emit$1(name, value, ns, prefixed) {
  object$3[prefixed || name] = value;
}

prototype$65.attributes = function(attr, item) {
  object$3 = {};
  attr(emit$1, item, this);
  return object$3;
};

prototype$65.mark = function(scene) {
  var renderer = this,
      mdef = marks[scene.marktype],
      tag  = mdef.tag,
      defs = this._defs,
      str = '',
      style;

  if (tag !== 'g' && scene.interactive === false) {
    style = 'style="pointer-events: none;"';
  }

  // render opening group tag
  str += openTag('g', {
    'class': cssClass(scene)
  }, style);

  // render contained elements
  function process(item) {
    style = (tag !== 'g') ? applyStyles(item, scene, tag, defs) : null;
    str += openTag(tag, renderer.attributes(mdef.attr, item), style);

    if (tag === 'text') {
      str += escape_text(textValue(item.text));
    } else if (tag === 'g') {
      str += openTag('path',
        renderer.attributes(mdef.background, item),
        applyStyles(item, scene, 'bgrect', defs)) + closeTag('path');
      str += renderer.markGroup(item);
    }

    str += closeTag(tag);
  }

  if (mdef.nested) {
    if (scene.items && scene.items.length) process(scene.items[0]);
  } else {
    visit(scene, process);
  }

  // render closing group tag
  return str + closeTag('g');
};

prototype$65.markGroup = function(scene) {
  var renderer = this,
      str = '';

  visit(scene, function(item) {
    str += renderer.mark(item);
  });

  return str;
};

function applyStyles(o, mark, tag, defs) {
  if (o == null) return '';
  var i, n, prop, name, value, s = '';

  if (tag === 'bgrect' && mark.interactive === false) {
    s += 'pointer-events: none;';
  }

  if (tag === 'text') {
    s += 'font: ' + font(o) + ';';
  }

  for (i=0, n=styleProperties.length; i<n; ++i) {
    prop = styleProperties[i];
    name = styles[prop];
    value = o[prop];

    if (value == null) {
      if (name === 'fill') {
        s += (s.length ? ' ' : '') + 'fill: none;';
      }
    } else {
      if (value.id) {
        // ensure definition is included
        defs.gradient[value.id] = value;
        value = 'url(#' + value.id + ')';
      }
      s += (s.length ? ' ' : '') + name + ': ' + value + ';';
    }
  }

  return s ? 'style="' + s + '"' : null;
}

function escape_text(s) {
  return s.replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
}

function scaleGradient(scale, p0, p1, count) {
  var gradient = Gradient(p0, p1),
      stops = scale.domain(),
      min = stops[0],
      max = stops[stops.length-1],
      i, n, fraction;

  if (scale.type !== 'linear' && scale.ticks) {
    stops = scale.ticks(+count || 15);
    if (min !== stops[0]) stops.unshift(min);
    if (max !== stops[stops.length-1]) stops.push(max);
  }

  fraction = scale.range
    ? scale.copy().domain([min, max]).range([0, 1])
    : function(_) { return (_ - min) / (max - min); };

  for (i=0, n=stops.length; i<n; ++i) {
    gradient.stop(fraction(stops[i]), scale(stops[i]));
  }

  return gradient;
}

/**
 * Calculate bounding boxes for scenegraph items.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - The scenegraph mark instance to bound.
 */
function Bound(params) {
  Transform.call(this, null, params);
}

var prototype$54 = inherits(Bound, Transform);

prototype$54.transform = function(_, pulse) {
  var mark = _.mark,
      type = marks[mark.marktype],
      bound = type.bound,
      markBounds = mark.bounds, rebound;

  mark.bounds_prev.clear().union(markBounds);

  if (type.nested) {
    // multi-item marks have a single bounds instance
    boundItem(mark, bound);
  }

  else if (_.modified()) {
    // operator parameters modified -> re-bound all items
    // updates group bounds in response to modified group content
    markBounds.clear();
    mark.items.forEach(function(item) {
      markBounds.union(boundItem(item, bound));
    });
  }

  else {
    // incrementally update bounds, re-bound mark as needed
    rebound = pulse.changed(pulse.REM);

    pulse.visit(pulse.ADD, function(item) {
      markBounds.union(boundItem(item, bound));
    });

    pulse.visit(pulse.MOD, function(item) {
      rebound = rebound || markBounds.alignsWith(item.bounds);
      markBounds.union(boundItem(item, bound));
    });

    if (rebound) {
      markBounds.clear();
      mark.items.forEach(function(item) { markBounds.union(item.bounds); });
    }
  }

  return pulse.modifies('bounds');
};

function boundItem(item, bound, opt) {
  item.bounds_prev.clear().union(item.bounds);
  return bound(item.bounds.clear(), item, opt);
}

/**
 * Bind scenegraph items to a scenegraph mark instance.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.markdef - The mark definition for creating the mark.
 *   This is an object of legal scenegraph mark properties which *must* include
 *   the 'marktype' property.
 * @param {Array<number>} params.scenepath - Scenegraph tree coordinates for the mark.
 *   The path is an array of integers, each indicating the index into
 *   a successive chain of items arrays.
 */
function Mark(params) {
  Transform.call(this, null, params);
}

var prototype$66 = inherits(Mark, Transform);

prototype$66.transform = function(_, pulse) {
  var mark = this.value;

  // acquire mark on first invocation
  if (!mark) {
    mark = pulse.dataflow.scenegraph().mark(_.scenepath, _.markdef);
    mark.source = this;
    this.value = mark;
    mark.group.context = _.scenepath.context;
  }

  // initialize entering items
  var Init = mark.marktype === 'group' ? GroupItem : Item;
  pulse.visit(pulse.ADD, function(item) { Init.call(item, mark); });

  // bind items array to scenegraph mark
  return (mark.items = pulse.source, pulse);
};

/**
 * Queue modified scenegraph items for rendering.
 * @constructor
 */
function Render(params) {
  Transform.call(this, null, params);
}

var prototype$67 = inherits(Render, Transform);

prototype$67.transform = function(_, pulse) {
  var view = pulse.dataflow;

  if (pulse.changed(pulse.REM)) {
    view.enqueue(pulse.materialize(pulse.REM).rem);
  }

  if (pulse.changed(pulse.ADD)) {
    view.enqueue(pulse.materialize(pulse.ADD).add);
  }

  if (pulse.changed(pulse.MOD)) {
    view.enqueue(pulse.materialize(pulse.MOD).mod);
  }

  // set z-index dirty flag as needed
  if (pulse.fields && pulse.fields['zindex']) {
    var item = pulse.source && pulse.source[0];
    if (item) item.mark.zdirty = true;
  }
};

var Fit = 'fit';
var Pad = 'pad';
var None$1 = 'none';
var AxisRole = 'axis';
var FrameRole = 'frame';
var LegendRole = 'legend';
var ScopeRole = 'scope';
/**
 * Layout view elements such as axes and legends.
 * Also performs size adjustments.
 * @constructor
 * @param {object} params - The parameters for this operator.
 * @param {object} params.mark - Scenegraph mark of groups to layout.
 */
function ViewLayout(params) {
  Transform.call(this, null, params);
}

var prototype$68 = inherits(ViewLayout, Transform);

prototype$68.transform = function(_, pulse) {
  // TODO incremental update, output?
  var view = pulse.dataflow;
  _.mark.items.forEach(function(group) {
    layoutGroup(view, group, _);
  });
  return pulse;
};

function layoutGroup(view, group, _) {
  var items = group.items,
      width = Math.max(0, group.width || 0),
      height = Math.max(0, group.height || 0),
      viewBounds = new Bounds().set(0, 0, width, height),
      markBounds = viewBounds.clone(),
      axisBounds = markBounds.clone(),
      legends = [],
      mark, flow, b, i, n;

  // layout axes, gather legends, collect bounds
  for (i=0, n=items.length; i<n; ++i) {
    mark = items[i];
    switch (mark.role) {
      case AxisRole:
        axisBounds.union(layoutAxis(mark, width, height));
        break;
      case LegendRole:
        legends.push(mark); break;
      case FrameRole:
      case ScopeRole:
        viewBounds.union(mark.bounds); // break omitted
      default:
        markBounds.union(mark.bounds);
    }
  }
  viewBounds.union(axisBounds);

  // layout legends, extending viewBounds
  if (legends.length) {
    flow = {left: 0, right: 0, margin: _.legendMargin || 8};
    axisBounds.union(markBounds);

    for (i=0, n=legends.length; i<n; ++i) {
      b = layoutLegend(legends[i], flow, axisBounds, width, height);
      (_.autosize === Fit)
        ? viewBounds.add(b.x1, 0).add(b.x2, 0)
        : viewBounds.union(b);
    }
  }

  // perform size adjustment
  layoutSize(view, group, markBounds, viewBounds.union(markBounds), _);
}

function layoutAxis(axis, width, height) {
  var item = axis.items[0],
      datum = item.datum,
      orient = datum.orient,
      ticksIndex = datum.grid ? 1 : 0,
      labelIndex = ticksIndex + 1,
      titleIndex = labelIndex + (datum.domain ? 2 : 1),
      range = item.range,
      offset = item.offset,
      position = item.position,
      minExtent = item.minExtent,
      maxExtent = item.maxExtent,
      title = datum.title && item.items[titleIndex].items[0],
      titlePadding = item.titlePadding,
      titleSize = title ? title.fontSize + titlePadding : 0,
      bounds = item.bounds,
      x = 0, y = 0, s;

  bounds.clear()
    .union(item.items[ticksIndex].bounds)
    .union(item.items[labelIndex].bounds);

  // position axis group and title
  switch (orient) {
    case 'top': {
      x = position || 0;
      y = -offset;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.y1));
      if (title) title.auto
        ? (title.y = -(titlePadding + s), s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, -s).add(range, 0);
      break;
    }
    case 'left': {
      x = -offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, -bounds.x1));
      if (title) title.auto
        ? (title.x = -(titlePadding + s), s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(-s, 0).add(0, range);
      break;
    }
    case 'right': {
      x = width + offset;
      y = position || 0;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.x2));
      if (title) title.auto
        ? (title.x = titlePadding + s, s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, 0).add(s, range);
      break;
    }
    case 'bottom': {
      x = position || 0;
      y = height + offset;
      s = Math.max(minExtent, Math.min(maxExtent, bounds.y2));
      if (title) title.auto
        ? (title.y = titlePadding + s, s += titleSize)
        : bounds.union(title.bounds);
      bounds.add(0, 0).add(range, s);
      break;
    }
  }

  item.x = x + 0.5;
  item.y = y + 0.5;

  // update bounds
  boundStroke(bounds.translate(x, y), item);
  item.mark.bounds.clear().union(bounds);
  return bounds;
}

function layoutLegend(legend, flow, axisBounds, width, height) {
  var item = legend.items[0],
      datum = item.datum,
      orient = datum.orient,
      offset = item.offset,
      bounds = item.bounds.clear(),
      x = 0,
      y = (flow[orient] || 0),
      w, h;

  // aggregate bounds to determine size
  // shave off 1 pixel because it looks better...
  item.items.forEach(function(_) { bounds.union(_.bounds); });
  w = Math.round(bounds.width()) + 2 * item.padding - 1;
  h = Math.round(bounds.height()) + 2 * item.padding - 1;

  switch (orient) {
    case 'left':
      x -= w + offset - Math.floor(axisBounds.x1);
      flow.left += h + flow.margin;
      break;
    case 'right':
      x += offset + Math.ceil(axisBounds.x2);
      flow.right += h + flow.margin;
      break;
    case 'top-left':
      x += offset;
      y += offset;
      break;
    case 'top-right':
      x += width - w - offset;
      y += offset;
      break;
    case 'bottom-left':
      x += offset;
      y += height - h - offset;
      break;
    case 'bottom-right':
      x += width - w - offset;
      y += height - h - offset;
      break;
  }

  // update legend layout
  item.x = x;
  item.y = y;
  item.width = w;
  item.height = h;

  // update bounds
  boundStroke(bounds.set(x, y, x + w, y + h), item);
  item.mark.bounds.clear().union(bounds);
  return bounds;
}

function layoutSize(view, group, markBounds, viewBounds, _) {
  var type = _.autosize,
      viewWidth = view._width,
      viewHeight = view._height;

  if (view._autosize < 1 || !type) return;

  var width  = Math.max(0, group.width || 0),
      left   = Math.max(0, Math.ceil(-viewBounds.x1)),
      right  = Math.max(0, Math.ceil(viewBounds.x2 - width)),
      height = Math.max(0, group.height || 0),
      top    = Math.max(0, Math.ceil(-viewBounds.y1)),
      bottom = Math.max(0, Math.ceil(viewBounds.y2 - height));

  if (type === None$1) {
    viewWidth = width;
    viewHeight = height;
    left = 0;
    top = 0;
  }

  else if (type === Fit) {
    width = Math.max(0, viewWidth - left - right);
    height = Math.max(0, viewHeight - top - bottom);
  }

  else if (type === Pad) {
    viewWidth = width + left + right;
    viewHeight = height + top + bottom;
    if (group.width  < 0) width = markBounds.width();
    if (group.height < 0) height = markBounds.height();
  }

  view.autosize(viewWidth, viewHeight, width, height, [left, top]);
}

var BindClass = 'vega-bind';
var NameClass = 'vega-bind-name';
var RadioClass = 'vega-bind-radio';
var OptionClass = 'vega-option-';
/**
 * Bind a signal to an external HTML input element. The resulting two-way
 * binding will propagate input changes to signals, and propagate signal
 * changes to the input element state. If this view instance has no parent
 * element, we assume the view is headless and no bindings are created.
 * @param {Element|string} el - The parent DOM element to which the input
 *   element should be appended as a child. If string-valued, this argument
 *   will be treated as a CSS selector. If null or undefined, the parent
 *   element of this view will be used as the element.
 * @param {object} param - The binding parameters which specify the signal
 *   to bind to, the input element type, and type-specific configuration.
 * @return {View} - This view instance.
 */
function bind$1(el, param) {
  if (this._el) bind$2(this, el || this._el, param);
  else this.warn('Bind not supported for headless views.');
  return this;
}

function bind$2(view, el, param) {
  var bind = {
    elements: null,
    set: null,
    update: function(value) { view.signal(param.signal, value).run(); }
  };

  if (isString(el)) el = document.querySelector(el);
  generate(bind, el, param, view.signal(param.signal));

  view.on(view._signals[param.signal], null, function() {
    bind.set(view.signal(param.signal));
  });

  return bind;
}

/**
 * Generate an HTML input form element and bind it to a signal.
 */
function generate(bind, el, param, value) {
  var div = element$1('div', {'class': BindClass});

  div.appendChild(element$1('span',
    {'class': NameClass},
    (param.name || param.signal)
  ));

  el.appendChild(div);

  var input = form;
  switch (param.type) {
    case 'checkbox': input = checkbox; break;
    case 'select':   input = select; break;
    case 'radio':    input = radio; break;
    case 'range':    input = range$2; break;
  }

  input(bind, div, param, value);
}

/**
 * Generates an arbitrary input form element.
 * The input type is controlled via user-provided parameters.
 */
function form(bind, el, param, value) {
  var node = element$1('input');

  for (var key in param) if (key !== 'signal' && key !== 'element') {
    node.setAttribute(key, param[key]);
  }
  node.setAttribute('name', param.signal);
  node.setAttribute('value', value);

  el.appendChild(node);

  node.addEventListener('input', function() {
    bind.update(node.value);
  });

  bind.elements = [node];
  bind.set = function(value) { node.value = value; };
}

/**
 * Generates a checkbox input element.
 */
function checkbox(bind, el, param, value) {
  var attr = {type: 'checkbox', name: param.signal};
  if (value) attr.checked = true;
  var node = element$1('input', attr);

  el.appendChild(node);

  node.addEventListener('change', function() {
    bind.update(node.checked);
  });

  bind.elements = [node];
  bind.set = function(value) { node.checked = !!value || null; }
}

/**
 * Generates a selection list input element.
 */
function select(bind, el, param, value) {
  var node = element$1('select', {name: param.signal});

  param.options.forEach(function(option) {
    var attr = {value: option};
    if (option === value) attr.selected = true;
    node.appendChild(element$1('option', attr, option));
  });

  el.appendChild(node);

  node.addEventListener('change', function() {
    bind.update(param.options[node.selectedIndex]);
  });

  bind.elements = [node];
  bind.set = function(value) {
    node.selectedIndex = param.options.indexOf(value);
  };
}

/**
 * Generates a radio button group.
 */
function radio(bind, el, param, value) {
  var group = element$1('span', {'class': RadioClass});

  el.appendChild(group);

  bind.elements = param.options.map(function(option) {
    var id = OptionClass + param.signal + '-' + option;

    var attr = {
      id:    id,
      type:  'radio',
      name:  param.signal,
      value: option
    };
    if (option === value) attr.checked = true;

    var input = element$1('input', attr);

    input.addEventListener('change', function() {
      bind.update(option);
    });

    group.appendChild(input);
    group.appendChild(element$1('label', {'for': id}, option));

    return input;
  });

  bind.set = function(value) {
    var nodes = bind.elements,
        i = 0,
        n = nodes.length;
    for (; i<n; ++i) {
      if (nodes[i].value === value) nodes[i].checked = true;
    }
  };
}

/**
 * Generates a slider input element.
 */
function range$2(bind, el, param, value) {
  value = value !== undefined ? value : ((+param.max) + (+param.min)) / 2;

  var min = param.min || Math.min(0, +value) || 0,
      max = param.max || Math.max(100, +value) || 100,
      step = param.step || tickStep(min, max, 100);

  var node = element$1('input', {
    type:  'range',
    value: value,
    name:  param.signal,
    min:   min,
    max:   max,
    step:  step
  });

  var label = element$1('label', {}, +value);

  el.appendChild(node);
  el.appendChild(label);

  node.addEventListener('input', function() {
    label.textContent = node.value;
    bind.update(+node.value);
  });

  bind.elements = [node];
  bind.set = function(value) {
    node.value = value;
    label.textContent = value;
  };
}

function element$1(tag, attr, text) {
  var el = document.createElement(tag);
  for (var key in attr) el.setAttribute(key, attr[key]);
  if (text != null) el.textContent = text;
  return el;
}

var Default = 'default';

function cursor(view) {
  var cursor = view._signals.cursor;

  // add cursor signal to dataflow, if needed
  if (!cursor) {
    view._signals.cursor = (cursor = view.add({user: Default, item: null}));
  }

  // evaluate cursor on each mousemove event
  view.on(view.events('view', 'mousemove'), cursor,
    function(_, event) {
      var value = cursor.value,
          user = value ? (isString(value) ? value : value.user) : Default,
          item = event.item && event.item.cursor || null;

      return (value && user === value.user && item == value.item) ? value
        : {user: user, item: item};
    }
  );

  // when cursor signal updates, set visible cursor
  view.add(null, function(_) {
    var user = _.cursor,
        item = this.value;

    if (!isString(user)) {
      item = user.item;
      user = user.user;
    }

    setCursor(user && user !== Default ? user : (item || user));

    return item;
  }, {cursor: cursor});
}

function setCursor(cursor) {
  // set cursor on document body
  // this ensures cursor applies even if dragging out of view
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.cursor = cursor;
  }
}

function dataref(view, name) {
  var data = view._runtime.data;
  if (!data.hasOwnProperty(name)) {
    view.error('Unrecognized data set: ' + name);
  }
  return data[name];
}

function data(name) {
  return dataref(this, name).values.value;
}

function insert(name, _) {
  return this.pulse(
    dataref(this, name).input,
    changeset().insert(_)
  );
}

function remove(name, _) {
  return this.pulse(
    dataref(this, name).input,
    changeset().remove(_)
  );
}

function width$1(view) {
  var padding = view.padding();
  return Math.max(0, view._width + padding.left + padding.right);
}

function height$1(view) {
  var padding = view.padding();
  return Math.max(0, view._height + padding.top + padding.bottom);
}

function offset$1(view) {
  var padding = view.padding(),
      origin = view._origin;
  return [
    padding.left + origin[0],
    padding.top + origin[1]
  ];
}

function resizeRenderer(view) {
  var origin = offset$1(view);
  view._renderer.background(view._background);
  view._renderer.resize(width$1(view), height$1(view), origin);
  view._handler.origin(origin);
}

/**
 * Extend an event with additional view-specific methods.
 * Adds a new property ('vega') to an event that provides a number
 * of methods for querying information about the current interaction.
 * The vega object provides the following methods:
 *   view - Returns the backing View instance.
 *   item - Returns the currently active scenegraph item (if any).
 *   group - Returns the currently active scenegraph group (if any).
 *     This method accepts a single string-typed argument indicating the name
 *     of the desired parent group. The scenegraph will be traversed from
 *     the item up towards the root to search for a matching group. If no
 *     argument is provided the enclosing group for the active item is
 *     returned, unless the item it itself a group, in which case it is
 *     returned directly.
 *   xy - Returns a two-element array containing the x and y coordinates for
 *     mouse or touch events. For touch events, this is based on the first
 *     elements in the changedTouches array. This method accepts a single
 *     argument: either an item instance or mark name that should serve as
 *     the reference coordinate system. If no argument is provided the
 *     top-level view coordinate system is assumed.
 *   x - Returns the current x-coordinate, accepts the same arguments as xy.
 *   y - Returns the current y-coordinate, accepts the same arguments as xy.
 * @param {Event} event - The input event to extend.
 * @param {Item} item - The currently active scenegraph item (if any).
 * @return {Event} - The extended input event.
 */
function eventExtend(view, event, item) {
  var el = view._renderer.element(),
      p, e, translate;

  if (el) {
    translate = offset$1(view);
    e = event.changedTouches ? event.changedTouches[0] : event;
    p = point$6(e, el);
    p[0] -= translate[0];
    p[1] -= translate[1];
  }

  return event.vega = extension(view, item, p), event.item = item, event;
}

function extension(view, item, point) {
  var itemGroup = item
    ? item.mark.marktype === 'group' ? item : item.mark.group
    : null;

  function group(name) {
    var g = itemGroup, i;
    if (name) for (i = item; i; i = i.mark.group) {
      if (i.mark.name === name) { g = i; break; }
    }
    return g && g.mark && g.mark.interactive ? g : {};
  }

  function xy(item) {
    if (!item) return point;
    if (isString(item)) item = group(item);

    var p = point.slice();
    while (item) {
      p[0] -= item.x || 0;
      p[1] -= item.y || 0;
      item = item.mark && item.mark.group;
    }
    return p;
  }

  return {
    view:  constant$1(view),
    item:  constant$1(item || {}),
    group: group,
    xy:    xy,
    x:     function(item) { return xy(item)[0]; },
    y:     function(item) { return xy(item)[1]; }
  };
}

/**
 * Create a new event stream from an event source.
 * @param {object} source - The event source to monitor.
 * @param {string} type - The event type.
 * @param {function(object): boolean} [filter] - Event filter function.
 * @return {EventStream}
 */
function events$1(source, type, filter) {
  var view = this,
      s = new EventStream(filter),
      send = function(e, item) {
        s.receive(eventExtend(view, e, item));
        view.run();
      },
      sources;

  if (source === 'view') {
    view._handler.on(type, send);
    return s;
  }

  if (source === 'window') {
    if (typeof window !== 'undefined') sources = [window];
  } else if (typeof document !== 'undefined') {
    sources = document.querySelectorAll(source);
  }

  if (!sources) {
    view.error('Can not resolve event source: ' + source);
  }

  for (var i=0, n=sources.length; i<n; ++i) {
    sources[i].addEventListener(type, send);
  }

  view._eventListeners.push({
    type:    type,
    sources: sources,
    handler: send
  });

  return s;
}

function itemFilter(event) {
  return event.item;
}

function markTarget(event) {
  // grab upstream collector feeding the mark operator
  var source = event.item.mark.source;
  return source.source || source;
}

function invoke(name) {
  return function(_, event) {
    return event.vega.view()
      .changeset()
      .encode(event.item, name);
  };
}

function hover(hoverSet, leaveSet) {
  // invoke hover set upon mouseover
  this.on(
    this.events('view', 'mouseover', itemFilter),
    markTarget,
    invoke(hoverSet || 'hover')
  );

  // invoke leave set upon mouseout
  this.on(
    this.events('view', 'mouseout', itemFilter),
    markTarget,
    invoke(leaveSet || 'update')
  );

  return this;
}

/**
 * Remove all external event listeners.
 */
function finalize() {
  var listeners = this._eventListeners,
      n = listeners.length, m, e;

  while (--n >= 0) {
    e = listeners[n];
    m = e.sources.length;
    while (--m >= 0) {
      e.sources[m].removeEventListener(e.type, e.handler);
    }
  }
}

function initializeRenderer(view, r, el, constructor) {
  r = r || new constructor(view.loader());
  return r
    .initialize(el, width$1(view), height$1(view), offset$1(view))
    .background(view._background);
}

function initializeHandler(view, prevHandler, el, constructor) {
  var handler = new constructor()
    .scene(view.scenegraph().root)
    .initialize(el, offset$1(view), view);

  if (prevHandler) {
    prevHandler.handlers().forEach(function(h) {
      handler.on(h.type, h.handler);
    });
  }

  return handler;
}

var Canvas$2 = 'canvas';
var PNG = 'png';
var SVG = 'svg';
var WebGL$2 = 'webgl';
var None$2 = 'none';

function initialize$1(el) {
  var view = this,
      type = view._renderType,
      Handler = CanvasHandler,
      Renderer = CanvasRenderer;

  // select appropriate renderer/handler types
  if (type === SVG) {
    Handler = SVGHandler;
    Renderer = (el ? SVGRenderer : SVGStringRenderer);
  }
  if (type === WebGL$2) {
    Handler = CanvasHandler;
    Renderer = WebGLRenderer;
  }

  // containing dom element
  if (el) {
    if (typeof el === 'string' && typeof document !== 'undefined') {
      el = document.querySelector(el);
    }
    el.innerHTML = ''; // clear
    view._el = el;
  } else {
    view._el = null; // headless
  }

  // initialize renderer and input handler
  view._renderer = (type === None$2) ? null
    : initializeRenderer(view, view._renderer, el, Renderer);
  view._handler = initializeHandler(view, view._handler, el, Handler);

  // initialize view bindings
  if (el && view._bind) view._bind.forEach(function(binding) {
    view.bind(binding.element || el, binding);
  });

  return view;
}

/**
 * Render the current scene in a headless fashion.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A Promise that resolves to a renderer.
 */
function renderHeadless(view, type) {
  return view.runAsync().then(function() {
    var renderClass = (type === SVG) ? SVGStringRenderer : ((type === WebGL$2) ? WebGLRenderer : CanvasRenderer);
    return initializeRenderer(view, null, null, renderClass)
      .renderAsync(view._scenegraph.root);
  });
}

/**
 * Produce an image URL for the visualization. Depending on the type
 * parameter, the generated URL contains data for either a PNG or SVG image.
 * The URL can be used (for example) to download images of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @param {string} type - The image type. One of 'svg', 'png' or 'canvas'.
 *   The 'canvas' and 'png' types are synonyms for a PNG image.
 * @return {Promise} - A promise that resolves to an image URL.
 */
function renderToImageURL(type) {
  if (type === PNG) type = Canvas$2;

  if (type !== SVG && type !== Canvas$2) {
    return Promise.reject('Unrecognized image type: ' + type);
  } else {
    return renderHeadless(this, type).then(function(renderer) {
      return type === Canvas$2
        ? renderer.canvas().toDataURL('image/png')
        : window.URL.createObjectURL(
            new Blob([renderer.svg()], {type: 'image/svg+xml'})
          );
    });
  }
}

/**
 * Produce a Canvas instance containing a rendered visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to a Canvas instance.
 */
function renderToCanvas() {
  return renderHeadless(this, Canvas$2)
    .then(function(renderer) { return renderer.canvas(); });
}

/**
 * Produce a rendered SVG string of the visualization.
 * This method is asynchronous, returning a Promise instance.
 * @return {Promise} - A promise that resolves to an SVG string.
 */
function renderToSVG() {
  return renderHeadless(this, SVG)
    .then(function(renderer) { return renderer.svg(); });
}

function parsePadding(spec) {
  return isObject(spec) ? spec
    : isNumber(spec) ? {top:spec, bottom:spec, left:spec, right:spec}
    : {top: 0, left: 0, bottom: 0, right: 0}; // TODO defaults
}

function parseSignal(signal, scope) {
  var op = scope.addSignal(signal.name, signal.value);
  if (signal.react === false) op.react = false;
  if (signal.bind) scope.addBinding(signal.name, signal.bind);
}

function ASTNode(type) {
  this.type = type;
}

ASTNode.prototype.visit = function(visitor) {
  var node = this, c, i, n;

  if (visitor(node)) return 1;

  for (c=children$1(node), i=0, n=c.length; i<n; ++i) {
    if (c[i].visit(visitor)) return 1;
  }
}

function children$1(node) {
  switch (node.type) {
    case 'ArrayExpression':
      return node.elements;
    case 'BinaryExpression':
    case 'LogicalExpression':
      return [node.left, node.right];
    case 'CallExpression':
      var args = node.arguments.slice();
      args.unshift(node.callee);
      return args;
    case 'ConditionalExpression':
      return [node.test, node.consequent, node.alternate];
    case 'MemberExpression':
      return [node.object, node.property];
    case 'ObjectExpression':
      return node.properties;
    case 'Property':
      return [node.key, node.value];
    case 'UnaryExpression':
      return [node.argument];
    case 'Identifier':
    case 'Literal':
    case 'RawCode':
    default:
      return [];
  }
}

/*
  The following expression parser is based on Esprima (http://esprima.org/).
  Original header comment and license for Esprima is included here:

  Copyright (C) 2013 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2013 Thaddee Tyl <thaddee.tyl@gmail.com>
  Copyright (C) 2013 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Ariya Hidayat <ariya.hidayat@gmail.com>
  Copyright (C) 2012 Mathias Bynens <mathias@qiwi.be>
  Copyright (C) 2012 Joost-Wim Boekesteijn <joost-wim@boekesteijn.nl>
  Copyright (C) 2012 Kris Kowal <kris.kowal@cixar.com>
  Copyright (C) 2012 Yusuke Suzuki <utatane.tea@gmail.com>
  Copyright (C) 2012 Arpad Borsos <arpad.borsos@googlemail.com>
  Copyright (C) 2011 Ariya Hidayat <ariya.hidayat@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/
var source$1;
var index$7;
var length$3;
var lookahead;
var TokenBooleanLiteral = 1;
var TokenEOF = 2;
var TokenIdentifier = 3;
var TokenKeyword = 4;
var TokenNullLiteral = 5;
var TokenNumericLiteral = 6;
var TokenPunctuator = 7;
var TokenStringLiteral = 8;
var SyntaxArrayExpression = 'ArrayExpression';
var SyntaxBinaryExpression = 'BinaryExpression';
var SyntaxCallExpression = 'CallExpression';
var SyntaxConditionalExpression = 'ConditionalExpression';
var SyntaxIdentifier = 'Identifier';
var SyntaxLiteral = 'Literal';
var SyntaxLogicalExpression = 'LogicalExpression';
var SyntaxMemberExpression = 'MemberExpression';
var SyntaxObjectExpression = 'ObjectExpression';
var SyntaxProperty = 'Property';
var SyntaxUnaryExpression = 'UnaryExpression';
var MessageUnexpectedToken = 'Unexpected token %0';
var MessageUnexpectedNumber = 'Unexpected number';
var MessageUnexpectedString = 'Unexpected string';
var MessageUnexpectedIdentifier = 'Unexpected identifier';
var MessageUnexpectedReserved = 'Unexpected reserved word';
var MessageUnexpectedEOS = 'Unexpected end of input';
var MessageInvalidRegExp = 'Invalid regular expression';
var MessageUnterminatedRegExp = 'Invalid regular expression: missing /';
var MessageStrictOctalLiteral = 'Octal literals are not allowed in strict mode.';
var MessageStrictDuplicateProperty = 'Duplicate data property in object literal not allowed in strict mode';
var ILLEGAL = 'ILLEGAL';
var DISABLED = 'Disabled.';
var RegexNonAsciiIdentifierStart = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]');
var RegexNonAsciiIdentifierPart = new RegExp('[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]');
// Ensure the condition is true, otherwise throw an error.
// This is only to have a better contract semantic, i.e. another safety net
// to catch a logic error. The condition shall be fulfilled in normal case.
// Do NOT use this to enforce a certain condition on any user input.

function assert$1(condition, message) {
  /* istanbul ignore next */
  if (!condition) {
    throw new Error('ASSERT: ' + message);
  }
}

function isDecimalDigit(ch) {
  return (ch >= 0x30 && ch <= 0x39); // 0..9
}

function isHexDigit(ch) {
  return '0123456789abcdefABCDEF'.indexOf(ch) >= 0;
}

function isOctalDigit(ch) {
  return '01234567'.indexOf(ch) >= 0;
}

// 7.2 White Space

function isWhiteSpace(ch) {
  return (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
    (ch >= 0x1680 && [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF].indexOf(ch) >= 0);
}

// 7.3 Line Terminators

function isLineTerminator(ch) {
  return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029);
}

// 7.6 Identifier Names and Identifiers

function isIdentifierStart(ch) {
  return (ch === 0x24) || (ch === 0x5F) || // $ (dollar) and _ (underscore)
    (ch >= 0x41 && ch <= 0x5A) || // A..Z
    (ch >= 0x61 && ch <= 0x7A) || // a..z
    (ch === 0x5C) || // \ (backslash)
    ((ch >= 0x80) && RegexNonAsciiIdentifierStart.test(String.fromCharCode(ch)));
}

function isIdentifierPart(ch) {
  return (ch === 0x24) || (ch === 0x5F) || // $ (dollar) and _ (underscore)
    (ch >= 0x41 && ch <= 0x5A) || // A..Z
    (ch >= 0x61 && ch <= 0x7A) || // a..z
    (ch >= 0x30 && ch <= 0x39) || // 0..9
    (ch === 0x5C) || // \ (backslash)
    ((ch >= 0x80) && RegexNonAsciiIdentifierPart.test(String.fromCharCode(ch)));
}

// 7.6.1.1 Keywords

var keywords = {
  'if':1, 'in':1, 'do':1,
  'var':1, 'for':1, 'new':1, 'try':1, 'let':1,
  'this':1, 'else':1, 'case':1, 'void':1, 'with':1, 'enum':1,
  'while':1, 'break':1, 'catch':1, 'throw':1, 'const':1, 'yield':1, 'class':1, 'super':1,
  'return':1, 'typeof':1, 'delete':1, 'switch':1, 'export':1, 'import':1, 'public':1, 'static':1,
  'default':1, 'finally':1, 'extends':1, 'package':1, 'private':1,
  'function':1, 'continue':1, 'debugger':1,
  'interface':1, 'protected':1,
  'instanceof':1, 'implements':1
};

function skipComment() {
  var ch;

  while (index$7 < length$3) {
    ch = source$1.charCodeAt(index$7);

    if (isWhiteSpace(ch) || isLineTerminator(ch)) {
      ++index$7;
    } else {
      break;
    }
  }
}

function scanHexEscape(prefix) {
  var i, len, ch, code = 0;

  len = (prefix === 'u') ? 4 : 2;
  for (i = 0; i < len; ++i) {
    if (index$7 < length$3 && isHexDigit(source$1[index$7])) {
      ch = source$1[index$7++];
      code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }
  return String.fromCharCode(code);
}

function scanUnicodeCodePointEscape() {
  var ch, code, cu1, cu2;

  ch = source$1[index$7];
  code = 0;

  // At least, one hex digit is required.
  if (ch === '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  while (index$7 < length$3) {
    ch = source$1[index$7++];
    if (!isHexDigit(ch)) {
      break;
    }
    code = code * 16 + '0123456789abcdef'.indexOf(ch.toLowerCase());
  }

  if (code > 0x10FFFF || ch !== '}') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  // UTF-16 Encoding
  if (code <= 0xFFFF) {
    return String.fromCharCode(code);
  }
  cu1 = ((code - 0x10000) >> 10) + 0xD800;
  cu2 = ((code - 0x10000) & 1023) + 0xDC00;
  return String.fromCharCode(cu1, cu2);
}

function getEscapedIdentifier() {
  var ch, id;

  ch = source$1.charCodeAt(index$7++);
  id = String.fromCharCode(ch);

  // '\u' (U+005C, U+0075) denotes an escaped character.
  if (ch === 0x5C) {
    if (source$1.charCodeAt(index$7) !== 0x75) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    ++index$7;
    ch = scanHexEscape('u');
    if (!ch || ch === '\\' || !isIdentifierStart(ch.charCodeAt(0))) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
    id = ch;
  }

  while (index$7 < length$3) {
    ch = source$1.charCodeAt(index$7);
    if (!isIdentifierPart(ch)) {
      break;
    }
    ++index$7;
    id += String.fromCharCode(ch);

    // '\u' (U+005C, U+0075) denotes an escaped character.
    if (ch === 0x5C) {
      id = id.substr(0, id.length - 1);
      if (source$1.charCodeAt(index$7) !== 0x75) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      ++index$7;
      ch = scanHexEscape('u');
      if (!ch || ch === '\\' || !isIdentifierPart(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
      id += ch;
    }
  }

  return id;
}

function getIdentifier() {
  var start, ch;

  start = index$7++;
  while (index$7 < length$3) {
    ch = source$1.charCodeAt(index$7);
    if (ch === 0x5C) {
      // Blackslash (U+005C) marks Unicode escape sequence.
      index$7 = start;
      return getEscapedIdentifier();
    }
    if (isIdentifierPart(ch)) {
      ++index$7;
    } else {
      break;
    }
  }

  return source$1.slice(start, index$7);
}

function scanIdentifier() {
  var start, id, type;

  start = index$7;

  // Backslash (U+005C) starts an escaped character.
  id = (source$1.charCodeAt(index$7) === 0x5C) ? getEscapedIdentifier() : getIdentifier();

  // There is no keyword or literal with only one character.
  // Thus, it must be an identifier.
  if (id.length === 1) {
    type = TokenIdentifier;
  } else if (keywords.hasOwnProperty(id)) {
    type = TokenKeyword;
  } else if (id === 'null') {
    type = TokenNullLiteral;
  } else if (id === 'true' || id === 'false') {
    type = TokenBooleanLiteral;
  } else {
    type = TokenIdentifier;
  }

  return {
    type: type,
    value: id,
    start: start,
    end: index$7
  };
}

// 7.7 Punctuators

function scanPunctuator() {
  var start = index$7,
    code = source$1.charCodeAt(index$7),
    code2,
    ch1 = source$1[index$7],
    ch2,
    ch3,
    ch4;

  switch (code) {

    // Check for most common single-character punctuators.
    case 0x2E: // . dot
    case 0x28: // ( open bracket
    case 0x29: // ) close bracket
    case 0x3B: // ; semicolon
    case 0x2C: // , comma
    case 0x7B: // { open curly brace
    case 0x7D: // } close curly brace
    case 0x5B: // [
    case 0x5D: // ]
    case 0x3A: // :
    case 0x3F: // ?
    case 0x7E: // ~
      ++index$7;
      return {
        type: TokenPunctuator,
        value: String.fromCharCode(code),
        start: start,
        end: index$7
      };

    default:
      code2 = source$1.charCodeAt(index$7 + 1);

      // '=' (U+003D) marks an assignment or comparison operator.
      if (code2 === 0x3D) {
        switch (code) {
          case 0x2B: // +
          case 0x2D: // -
          case 0x2F: // /
          case 0x3C: // <
          case 0x3E: // >
          case 0x5E: // ^
          case 0x7C: // |
          case 0x25: // %
          case 0x26: // &
          case 0x2A: // *
            index$7 += 2;
            return {
              type: TokenPunctuator,
              value: String.fromCharCode(code) + String.fromCharCode(code2),
              start: start,
              end: index$7
            };

          case 0x21: // !
          case 0x3D: // =
            index$7 += 2;

            // !== and ===
            if (source$1.charCodeAt(index$7) === 0x3D) {
              ++index$7;
            }
            return {
              type: TokenPunctuator,
              value: source$1.slice(start, index$7),
              start: start,
              end: index$7
            };
        }
      }
  }

  // 4-character punctuator: >>>=

  ch4 = source$1.substr(index$7, 4);

  if (ch4 === '>>>=') {
    index$7 += 4;
    return {
      type: TokenPunctuator,
      value: ch4,
      start: start,
      end: index$7
    };
  }

  // 3-character punctuators: === !== >>> <<= >>=

  ch3 = ch4.substr(0, 3);

  if (ch3 === '>>>' || ch3 === '<<=' || ch3 === '>>=') {
    index$7 += 3;
    return {
      type: TokenPunctuator,
      value: ch3,
      start: start,
      end: index$7
    };
  }

  // Other 2-character punctuators: ++ -- << >> && ||
  ch2 = ch3.substr(0, 2);

  if ((ch1 === ch2[1] && ('+-<>&|'.indexOf(ch1) >= 0)) || ch2 === '=>') {
    index$7 += 2;
    return {
      type: TokenPunctuator,
      value: ch2,
      start: start,
      end: index$7
    };
  }

  // 1-character punctuators: < > = ! + - * % & | ^ /

  if ('<>=!+-*%&|^/'.indexOf(ch1) >= 0) {
    ++index$7;
    return {
      type: TokenPunctuator,
      value: ch1,
      start: start,
      end: index$7
    };
  }

  throwError({}, MessageUnexpectedToken, ILLEGAL);
}

// 7.8.3 Numeric Literals

function scanHexLiteral(start) {
  var number = '';

  while (index$7 < length$3) {
    if (!isHexDigit(source$1[index$7])) {
      break;
    }
    number += source$1[index$7++];
  }

  if (number.length === 0) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  if (isIdentifierStart(source$1.charCodeAt(index$7))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseInt('0x' + number, 16),
    start: start,
    end: index$7
  };
}

function scanOctalLiteral(start) {
  var number = '0' + source$1[index$7++];
  while (index$7 < length$3) {
    if (!isOctalDigit(source$1[index$7])) {
      break;
    }
    number += source$1[index$7++];
  }

  if (isIdentifierStart(source$1.charCodeAt(index$7)) || isDecimalDigit(source$1.charCodeAt(index$7))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseInt(number, 8),
    octal: true,
    start: start,
    end: index$7
  };
}

function scanNumericLiteral() {
  var number, start, ch;

  ch = source$1[index$7];
  assert$1(isDecimalDigit(ch.charCodeAt(0)) || (ch === '.'),
    'Numeric literal must start with a decimal digit or a decimal point');

  start = index$7;
  number = '';
  if (ch !== '.') {
    number = source$1[index$7++];
    ch = source$1[index$7];

    // Hex number starts with '0x'.
    // Octal number starts with '0'.
    if (number === '0') {
      if (ch === 'x' || ch === 'X') {
        ++index$7;
        return scanHexLiteral(start);
      }
      if (isOctalDigit(ch)) {
        return scanOctalLiteral(start);
      }

      // decimal number starts with '0' such as '09' is illegal.
      if (ch && isDecimalDigit(ch.charCodeAt(0))) {
        throwError({}, MessageUnexpectedToken, ILLEGAL);
      }
    }

    while (isDecimalDigit(source$1.charCodeAt(index$7))) {
      number += source$1[index$7++];
    }
    ch = source$1[index$7];
  }

  if (ch === '.') {
    number += source$1[index$7++];
    while (isDecimalDigit(source$1.charCodeAt(index$7))) {
      number += source$1[index$7++];
    }
    ch = source$1[index$7];
  }

  if (ch === 'e' || ch === 'E') {
    number += source$1[index$7++];

    ch = source$1[index$7];
    if (ch === '+' || ch === '-') {
      number += source$1[index$7++];
    }
    if (isDecimalDigit(source$1.charCodeAt(index$7))) {
      while (isDecimalDigit(source$1.charCodeAt(index$7))) {
        number += source$1[index$7++];
      }
    } else {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    }
  }

  if (isIdentifierStart(source$1.charCodeAt(index$7))) {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenNumericLiteral,
    value: parseFloat(number),
    start: start,
    end: index$7
  };
}

// 7.8.4 String Literals

function scanStringLiteral() {
  var str = '',
    quote, start, ch, code, octal = false;

  quote = source$1[index$7];
  assert$1((quote === '\'' || quote === '"'),
    'String literal must starts with a quote');

  start = index$7;
  ++index$7;

  while (index$7 < length$3) {
    ch = source$1[index$7++];

    if (ch === quote) {
      quote = '';
      break;
    } else if (ch === '\\') {
      ch = source$1[index$7++];
      if (!ch || !isLineTerminator(ch.charCodeAt(0))) {
        switch (ch) {
          case 'u':
          case 'x':
            if (source$1[index$7] === '{') {
              ++index$7;
              str += scanUnicodeCodePointEscape();
            } else {
              str += scanHexEscape(ch);
            }
            break;
          case 'n':
            str += '\n';
            break;
          case 'r':
            str += '\r';
            break;
          case 't':
            str += '\t';
            break;
          case 'b':
            str += '\b';
            break;
          case 'f':
            str += '\f';
            break;
          case 'v':
            str += '\x0B';
            break;

          default:
            if (isOctalDigit(ch)) {
              code = '01234567'.indexOf(ch);

              // \0 is not octal escape sequence
              if (code !== 0) {
                octal = true;
              }

              if (index$7 < length$3 && isOctalDigit(source$1[index$7])) {
                octal = true;
                code = code * 8 + '01234567'.indexOf(source$1[index$7++]);

                // 3 digits are only allowed when string starts
                // with 0, 1, 2, 3
                if ('0123'.indexOf(ch) >= 0 &&
                  index$7 < length$3 &&
                  isOctalDigit(source$1[index$7])) {
                  code = code * 8 + '01234567'.indexOf(source$1[index$7++]);
                }
              }
              str += String.fromCharCode(code);
            } else {
              str += ch;
            }
            break;
        }
      } else {
        if (ch === '\r' && source$1[index$7] === '\n') {
          ++index$7;
        }
      }
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      break;
    } else {
      str += ch;
    }
  }

  if (quote !== '') {
    throwError({}, MessageUnexpectedToken, ILLEGAL);
  }

  return {
    type: TokenStringLiteral,
    value: str,
    octal: octal,
    start: start,
    end: index$7
  };
}

function testRegExp(pattern, flags) {
  var tmp = pattern;

  if (flags.indexOf('u') >= 0) {
    // Replace each astral symbol and every Unicode code point
    // escape sequence with a single ASCII symbol to avoid throwing on
    // regular expressions that are only valid in combination with the
    // `/u` flag.
    // Note: replacing with the ASCII symbol `x` might cause false
    // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
    // perfectly valid pattern that is equivalent to `[a-b]`, but it
    // would be replaced by `[x-b]` which throws an error.
    tmp = tmp
      .replace(/\\u\{([0-9a-fA-F]+)\}/g, function($0, $1) {
        if (parseInt($1, 16) <= 0x10FFFF) {
          return 'x';
        }
        throwError({}, MessageInvalidRegExp);
      })
      .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, 'x');
  }

  // First, detect invalid regular expressions.
  try {
    new RegExp(tmp);
  } catch (e) {
    throwError({}, MessageInvalidRegExp);
  }

  // Return a regular expression object for this pattern-flag pair, or
  // `null` in case the current environment doesn't support the flags it
  // uses.
  try {
    return new RegExp(pattern, flags);
  } catch (exception) {
    return null;
  }
}

function scanRegExpBody() {
  var ch, str, classMarker, terminated, body;

  ch = source$1[index$7];
  assert$1(ch === '/', 'Regular expression literal must start with a slash');
  str = source$1[index$7++];

  classMarker = false;
  terminated = false;
  while (index$7 < length$3) {
    ch = source$1[index$7++];
    str += ch;
    if (ch === '\\') {
      ch = source$1[index$7++];
      // ECMA-262 7.8.5
      if (isLineTerminator(ch.charCodeAt(0))) {
        throwError({}, MessageUnterminatedRegExp);
      }
      str += ch;
    } else if (isLineTerminator(ch.charCodeAt(0))) {
      throwError({}, MessageUnterminatedRegExp);
    } else if (classMarker) {
      if (ch === ']') {
        classMarker = false;
      }
    } else {
      if (ch === '/') {
        terminated = true;
        break;
      } else if (ch === '[') {
        classMarker = true;
      }
    }
  }

  if (!terminated) {
    throwError({}, MessageUnterminatedRegExp);
  }

  // Exclude leading and trailing slash.
  body = str.substr(1, str.length - 2);
  return {
    value: body,
    literal: str
  };
}

function scanRegExpFlags() {
  var ch, str, flags;

  str = '';
  flags = '';
  while (index$7 < length$3) {
    ch = source$1[index$7];
    if (!isIdentifierPart(ch.charCodeAt(0))) {
      break;
    }

    ++index$7;
    if (ch === '\\' && index$7 < length$3) {
      throwError({}, MessageUnexpectedToken, ILLEGAL);
    } else {
      flags += ch;
      str += ch;
    }
  }

  if (flags.search(/[^gimuy]/g) >= 0) {
    throwError({}, MessageInvalidRegExp, flags);
  }

  return {
    value: flags,
    literal: str
  };
}

function scanRegExp() {
  var start, body, flags, value;

  lookahead = null;
  skipComment();
  start = index$7;

  body = scanRegExpBody();
  flags = scanRegExpFlags();
  value = testRegExp(body.value, flags.value);

  return {
    literal: body.literal + flags.literal,
    value: value,
    regex: {
      pattern: body.value,
      flags: flags.value
    },
    start: start,
    end: index$7
  };
}

function isIdentifierName(token) {
  return token.type === TokenIdentifier ||
    token.type === TokenKeyword ||
    token.type === TokenBooleanLiteral ||
    token.type === TokenNullLiteral;
}

function advance() {
  var ch;

  skipComment();

  if (index$7 >= length$3) {
    return {
      type: TokenEOF,
      start: index$7,
      end: index$7
    };
  }

  ch = source$1.charCodeAt(index$7);

  if (isIdentifierStart(ch)) {
    return scanIdentifier();
  }

  // Very common: ( and ) and ;
  if (ch === 0x28 || ch === 0x29 || ch === 0x3B) {
    return scanPunctuator();
  }

  // String literal starts with single quote (U+0027) or double quote (U+0022).
  if (ch === 0x27 || ch === 0x22) {
    return scanStringLiteral();
  }


  // Dot (.) U+002E can also start a floating-point number, hence the need
  // to check the next character.
  if (ch === 0x2E) {
    if (isDecimalDigit(source$1.charCodeAt(index$7 + 1))) {
      return scanNumericLiteral();
    }
    return scanPunctuator();
  }

  if (isDecimalDigit(ch)) {
    return scanNumericLiteral();
  }

  return scanPunctuator();
}

function lex() {
  var token;

  token = lookahead;
  index$7 = token.end;

  lookahead = advance();

  index$7 = token.end;

  return token;
}

function peek$1() {
  var pos;

  pos = index$7;

  lookahead = advance();
  index$7 = pos;
}

function finishArrayExpression(elements) {
  var node = new ASTNode(SyntaxArrayExpression);
  node.elements = elements;
  return node;
}

function finishBinaryExpression(operator, left, right) {
  var node = new ASTNode((operator === '||' || operator === '&&') ? SyntaxLogicalExpression : SyntaxBinaryExpression);
  node.operator = operator;
  node.left = left;
  node.right = right;
  return node;
}

function finishCallExpression(callee, args) {
  var node = new ASTNode(SyntaxCallExpression);
  node.callee = callee;
  node.arguments = args;
  return node;
}

function finishConditionalExpression(test, consequent, alternate) {
  var node = new ASTNode(SyntaxConditionalExpression);
  node.test = test;
  node.consequent = consequent;
  node.alternate = alternate;
  return node;
}

function finishIdentifier(name) {
  var node = new ASTNode(SyntaxIdentifier);
  node.name = name;
  return node;
}

function finishLiteral(token) {
  var node = new ASTNode(SyntaxLiteral);
  node.value = token.value;
  node.raw = source$1.slice(token.start, token.end);
  if (token.regex) {
    if (node.raw === '//') {
      node.raw = '/(?:)/';
    }
    node.regex = token.regex;
  }
  return node;
}

function finishMemberExpression(accessor, object, property) {
  var node = new ASTNode(SyntaxMemberExpression);
  node.computed = accessor === '[';
  node.object = object;
  node.property = property;
  if (!node.computed) property.member = true;
  return node;
}

function finishObjectExpression(properties) {
  var node = new ASTNode(SyntaxObjectExpression);
  node.properties = properties;
  return node;
}

function finishProperty(kind, key, value) {
  var node = new ASTNode(SyntaxProperty);
  node.key = key;
  node.value = value;
  node.kind = kind;
  return node;
}

function finishUnaryExpression(operator, argument) {
  var node = new ASTNode(SyntaxUnaryExpression);
  node.operator = operator;
  node.argument = argument;
  node.prefix = true;
  return node;
}

// Throw an exception

function throwError(token, messageFormat) {
  var error,
    args = Array.prototype.slice.call(arguments, 2),
    msg = messageFormat.replace(
      /%(\d)/g,
      function(whole, index) {
        assert$1(index < args.length, 'Message reference must be in range');
        return args[index];
      }
    );


  error = new Error(msg);
  error.index = index$7;
  error.description = msg;
  throw error;
}

// Throw an exception because of the token.

function throwUnexpected(token) {
  if (token.type === TokenEOF) {
    throwError(token, MessageUnexpectedEOS);
  }

  if (token.type === TokenNumericLiteral) {
    throwError(token, MessageUnexpectedNumber);
  }

  if (token.type === TokenStringLiteral) {
    throwError(token, MessageUnexpectedString);
  }

  if (token.type === TokenIdentifier) {
    throwError(token, MessageUnexpectedIdentifier);
  }

  if (token.type === TokenKeyword) {
    throwError(token, MessageUnexpectedReserved);
  }

  // BooleanLiteral, NullLiteral, or Punctuator.
  throwError(token, MessageUnexpectedToken, token.value);
}

// Expect the next token to match the specified punctuator.
// If not, an exception will be thrown.

function expect(value) {
  var token = lex();
  if (token.type !== TokenPunctuator || token.value !== value) {
    throwUnexpected(token);
  }
}

// Return true if the next token matches the specified punctuator.

function match(value) {
  return lookahead.type === TokenPunctuator && lookahead.value === value;
}

// Return true if the next token matches the specified keyword

function matchKeyword(keyword) {
  return lookahead.type === TokenKeyword && lookahead.value === keyword;
}

// 11.1.4 Array Initialiser

function parseArrayInitialiser() {
  var elements = [];

  index$7 = lookahead.start;
  expect('[');

  while (!match(']')) {
    if (match(',')) {
      lex();
      elements.push(null);
    } else {
      elements.push(parseConditionalExpression());

      if (!match(']')) {
        expect(',');
      }
    }
  }

  lex();

  return finishArrayExpression(elements);
}

// 11.1.5 Object Initialiser

function parseObjectPropertyKey() {
  var token;

  index$7 = lookahead.start;
  token = lex();

  // Note: This function is called only from parseObjectProperty(), where
  // EOF and Punctuator tokens are already filtered out.

  if (token.type === TokenStringLiteral || token.type === TokenNumericLiteral) {
    if (token.octal) {
      throwError(token, MessageStrictOctalLiteral);
    }
    return finishLiteral(token);
  }

  return finishIdentifier(token.value);
}

function parseObjectProperty() {
  var token, key, id, value;

  index$7 = lookahead.start;
  token = lookahead;

  if (token.type === TokenIdentifier) {
    id = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', id, value);
  }
  if (token.type === TokenEOF || token.type === TokenPunctuator) {
    throwUnexpected(token);
  } else {
    key = parseObjectPropertyKey();
    expect(':');
    value = parseConditionalExpression();
    return finishProperty('init', key, value);
  }
}

function parseObjectInitialiser() {
  var properties = [],
    property, name, key, map = {},
    toString = String;

  index$7 = lookahead.start;
  expect('{');

  while (!match('}')) {
    property = parseObjectProperty();

    if (property.key.type === SyntaxIdentifier) {
      name = property.key.name;
    } else {
      name = toString(property.key.value);
    }

    key = '$' + name;
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      throwError({}, MessageStrictDuplicateProperty);
    } else {
      map[key] = true;
    }

    properties.push(property);

    if (!match('}')) {
      expect(',');
    }
  }

  expect('}');

  return finishObjectExpression(properties);
}

// 11.1.6 The Grouping Operator

function parseGroupExpression() {
  var expr;

  expect('(');

  expr = parseExpression$1();

  expect(')');

  return expr;
}


// 11.1 Primary Expressions

var legalKeywords = {
  "if": 1,
  "this": 1
};

function parsePrimaryExpression() {
  var type, token, expr;

  if (match('(')) {
    return parseGroupExpression();
  }

  if (match('[')) {
    return parseArrayInitialiser();
  }

  if (match('{')) {
    return parseObjectInitialiser();
  }

  type = lookahead.type;
  index$7 = lookahead.start;


  if (type === TokenIdentifier || legalKeywords[lookahead.value]) {
    expr = finishIdentifier(lex().value);
  } else if (type === TokenStringLiteral || type === TokenNumericLiteral) {
    if (lookahead.octal) {
      throwError(lookahead, MessageStrictOctalLiteral);
    }
    expr = finishLiteral(lex());
  } else if (type === TokenKeyword) {
    throw new Error(DISABLED);
  } else if (type === TokenBooleanLiteral) {
    token = lex();
    token.value = (token.value === 'true');
    expr = finishLiteral(token);
  } else if (type === TokenNullLiteral) {
    token = lex();
    token.value = null;
    expr = finishLiteral(token);
  } else if (match('/') || match('/=')) {
    expr = finishLiteral(scanRegExp());
    peek$1();
  } else {
    throwUnexpected(lex());
  }

  return expr;
}

// 11.2 Left-Hand-Side Expressions

function parseArguments() {
  var args = [];

  expect('(');

  if (!match(')')) {
    while (index$7 < length$3) {
      args.push(parseConditionalExpression());
      if (match(')')) {
        break;
      }
      expect(',');
    }
  }

  expect(')');

  return args;
}

function parseNonComputedProperty() {
  var token;
  index$7 = lookahead.start;
  token = lex();

  if (!isIdentifierName(token)) {
    throwUnexpected(token);
  }

  return finishIdentifier(token.value);
}

function parseNonComputedMember() {
  expect('.');

  return parseNonComputedProperty();
}

function parseComputedMember() {
  var expr;

  expect('[');

  expr = parseExpression$1();

  expect(']');

  return expr;
}

function parseLeftHandSideExpressionAllowCall() {
  var expr, args, property;

  expr = parsePrimaryExpression();

  for (;;) {
    if (match('.')) {
      property = parseNonComputedMember();
      expr = finishMemberExpression('.', expr, property);
    } else if (match('(')) {
      args = parseArguments();
      expr = finishCallExpression(expr, args);
    } else if (match('[')) {
      property = parseComputedMember();
      expr = finishMemberExpression('[', expr, property);
    } else {
      break;
    }
  }

  return expr;
}

// 11.3 Postfix Expressions

function parsePostfixExpression() {
  var expr = parseLeftHandSideExpressionAllowCall();

  if (lookahead.type === TokenPunctuator) {
    if ((match('++') || match('--'))) {
      throw new Error(DISABLED);
    }
  }

  return expr;
}

// 11.4 Unary Operators

function parseUnaryExpression() {
  var token, expr;

  if (lookahead.type !== TokenPunctuator && lookahead.type !== TokenKeyword) {
    expr = parsePostfixExpression();
  } else if (match('++') || match('--')) {
    throw new Error(DISABLED);
  } else if (match('+') || match('-') || match('~') || match('!')) {
    token = lex();
    expr = parseUnaryExpression();
    expr = finishUnaryExpression(token.value, expr);
  } else if (matchKeyword('delete') || matchKeyword('void') || matchKeyword('typeof')) {
    throw new Error(DISABLED);
  } else {
    expr = parsePostfixExpression();
  }

  return expr;
}

function binaryPrecedence(token) {
  var prec = 0;

  if (token.type !== TokenPunctuator && token.type !== TokenKeyword) {
    return 0;
  }

  switch (token.value) {
    case '||':
      prec = 1;
      break;

    case '&&':
      prec = 2;
      break;

    case '|':
      prec = 3;
      break;

    case '^':
      prec = 4;
      break;

    case '&':
      prec = 5;
      break;

    case '==':
    case '!=':
    case '===':
    case '!==':
      prec = 6;
      break;

    case '<':
    case '>':
    case '<=':
    case '>=':
    case 'instanceof':
    case 'in':
      prec = 7;
      break;

    case '<<':
    case '>>':
    case '>>>':
      prec = 8;
      break;

    case '+':
    case '-':
      prec = 9;
      break;

    case '*':
    case '/':
    case '%':
      prec = 11;
      break;

    default:
      break;
  }

  return prec;
}

// 11.5 Multiplicative Operators
// 11.6 Additive Operators
// 11.7 Bitwise Shift Operators
// 11.8 Relational Operators
// 11.9 Equality Operators
// 11.10 Binary Bitwise Operators
// 11.11 Binary Logical Operators

function parseBinaryExpression() {
  var marker, markers, expr, token, prec, stack, right, operator, left, i;

  marker = lookahead;
  left = parseUnaryExpression();

  token = lookahead;
  prec = binaryPrecedence(token);
  if (prec === 0) {
    return left;
  }
  token.prec = prec;
  lex();

  markers = [marker, lookahead];
  right = parseUnaryExpression();

  stack = [left, token, right];

  while ((prec = binaryPrecedence(lookahead)) > 0) {

    // Reduce: make a binary expression from the three topmost entries.
    while ((stack.length > 2) && (prec <= stack[stack.length - 2].prec)) {
      right = stack.pop();
      operator = stack.pop().value;
      left = stack.pop();
      markers.pop();
      expr = finishBinaryExpression(operator, left, right);
      stack.push(expr);
    }

    // Shift.
    token = lex();
    token.prec = prec;
    stack.push(token);
    markers.push(lookahead);
    expr = parseUnaryExpression();
    stack.push(expr);
  }

  // Final reduce to clean-up the stack.
  i = stack.length - 1;
  expr = stack[i];
  markers.pop();
  while (i > 1) {
    markers.pop()
    expr = finishBinaryExpression(stack[i - 1].value, stack[i - 2], expr);
    i -= 2;
  }

  return expr;
}

// 11.12 Conditional Operator

function parseConditionalExpression() {
  var expr, consequent, alternate;

  expr = parseBinaryExpression();

  if (match('?')) {
    lex();
    consequent = parseConditionalExpression();
    expect(':');
    alternate = parseConditionalExpression();

    expr = finishConditionalExpression(expr, consequent, alternate);
  }

  return expr;
}

// 11.14 Comma Operator

function parseExpression$1() {
  var expr = parseConditionalExpression();

  if (match(',')) {
    throw new Error(DISABLED); // no sequence expressions
  }

  return expr;
}

function parse$4(code) {
  source$1 = code;
  index$7 = 0;
  length$3 = source$1.length;
  lookahead = null;

  peek$1();

  var expr = parseExpression$1();

  if (lookahead.type !== TokenEOF) {
    throw new Error("Unexpect token after expression.");
  }
  return expr;
}

var Constants = {
  NaN:     'NaN',
  E:       'Math.E',
  LN2:     'Math.LN2',
  LN10:    'Math.LN10',
  LOG2E:   'Math.LOG2E',
  LOG10E:  'Math.LOG10E',
  PI:      'Math.PI',
  SQRT1_2: 'Math.SQRT1_2',
  SQRT2:   'Math.SQRT2'
};

function Functions(codegen) {

  function fncall(name, args, cast, type) {
    var obj = codegen(args[0]);
    if (cast) {
      obj = cast + '(' + obj + ')';
      if (cast.lastIndexOf('new ', 0) === 0) obj = '(' + obj + ')';
    }
    return obj + '.' + name + (type < 0 ? '' : type === 0 ?
      '()' :
      '(' + args.slice(1).map(codegen).join(',') + ')');
  }

  function fn(name, cast, type) {
    return function(args) {
      return fncall(name, args, cast, type);
    };
  }

  var DATE = 'new Date',
      STRING = 'String',
      REGEXP = 'RegExp';

  return {
    // MATH functions
    isNaN:    'isNaN',
    isFinite: 'isFinite',
    abs:      'Math.abs',
    acos:     'Math.acos',
    asin:     'Math.asin',
    atan:     'Math.atan',
    atan2:    'Math.atan2',
    ceil:     'Math.ceil',
    cos:      'Math.cos',
    exp:      'Math.exp',
    floor:    'Math.floor',
    log:      'Math.log',
    max:      'Math.max',
    min:      'Math.min',
    pow:      'Math.pow',
    random:   'Math.random',
    round:    'Math.round',
    sin:      'Math.sin',
    sqrt:     'Math.sqrt',
    tan:      'Math.tan',

    clamp: function(args) {
      if (args.length < 3) error('Missing arguments to clamp function.');
      if (args.length > 3) error('Too many arguments to clamp function.');
      var a = args.map(codegen);
      return 'Math.max('+a[1]+', Math.min('+a[2]+','+a[0]+'))';
    },

    // DATE functions
    now:             'Date.now',
    utc:             'Date.UTC',
    datetime:        DATE,
    date:            fn('getDate', DATE, 0),
    day:             fn('getDay', DATE, 0),
    year:            fn('getFullYear', DATE, 0),
    month:           fn('getMonth', DATE, 0),
    hours:           fn('getHours', DATE, 0),
    minutes:         fn('getMinutes', DATE, 0),
    seconds:         fn('getSeconds', DATE, 0),
    milliseconds:    fn('getMilliseconds', DATE, 0),
    time:            fn('getTime', DATE, 0),
    timezoneoffset:  fn('getTimezoneOffset', DATE, 0),
    utcdate:         fn('getUTCDate', DATE, 0),
    utcday:          fn('getUTCDay', DATE, 0),
    utcyear:         fn('getUTCFullYear', DATE, 0),
    utcmonth:        fn('getUTCMonth', DATE, 0),
    utchours:        fn('getUTCHours', DATE, 0),
    utcminutes:      fn('getUTCMinutes', DATE, 0),
    utcseconds:      fn('getUTCSeconds', DATE, 0),
    utcmilliseconds: fn('getUTCMilliseconds', DATE, 0),

    // shared sequence functions
    length:      fn('length', null, -1),
    indexof:     fn('indexOf', null),
    lastindexof: fn('lastIndexOf', null),
    slice:       fn('slice', null),

    // STRING functions
    parseFloat:  'parseFloat',
    parseInt:    'parseInt',
    upper:       fn('toUpperCase', STRING, 0),
    lower:       fn('toLowerCase', STRING, 0),
    substring:   fn('substring', STRING),
    replace:     fn('replace', STRING),

    // REGEXP functions
    regexp:  REGEXP,
    test:    fn('test', REGEXP),

    // Control Flow functions
    if: function(args) {
        if (args.length < 3) error('Missing arguments to if function.');
        if (args.length > 3) error('Too many arguments to if function.');
        var a = args.map(codegen);
        return a[0]+'?'+a[1]+':'+a[2];
      }
  };
}

function codegen(opt) {
  opt = opt || {};

  var whitelist = opt.whitelist ? toSet(opt.whitelist) : {},
      blacklist = opt.blacklist ? toSet(opt.blacklist) : {},
      constants = opt.constants || Constants,
      functions = (opt.functions || Functions)(visit),
      globalvar = opt.globalvar,
      fieldvar = opt.fieldvar,
      globals = {},
      fields = {},
      memberDepth = 0;

  var outputGlobal = isFunction(globalvar)
    ? globalvar
    : function (id) { return globalvar + '["' + id + '"]'; };

  function visit(ast) {
    if (isString(ast)) return ast;
    var generator = Generators[ast.type];
    if (generator == null) error('Unsupported type: ' + ast.type);
    return generator(ast);
  }

  var Generators = {
    Literal: function(n) {
        return n.raw;
      },

    Identifier: function(n) {
        var id = n.name;
        return memberDepth > 0 ? id
          : blacklist.hasOwnProperty(id) ? error('Illegal identifier: ' + id)
          : constants.hasOwnProperty(id) ? constants[id]
          : whitelist.hasOwnProperty(id) ? id
          : (globals[id] = 1, outputGlobal(id));
      },

    MemberExpression: function(n) {
        var d = !n.computed;
        var o = visit(n.object);
        if (d) memberDepth += 1;
        var p = visit(n.property);
        if (o === fieldvar) { fields[p] = 1; } // HACKish...
        if (d) memberDepth -= 1;
        return o + (d ? '.'+p : '['+p+']');
      },

    CallExpression: function(n) {
        if (n.callee.type !== 'Identifier') {
          error('Illegal callee type: ' + n.callee.type);
        }
        var callee = n.callee.name;
        var args = n.arguments;
        var fn = functions.hasOwnProperty(callee) && functions[callee];
        if (!fn) error('Unrecognized function: ' + callee);
        return isFunction(fn)
          ? fn(args)
          : fn + '(' + args.map(visit).join(',') + ')';
      },

    ArrayExpression: function(n) {
        return '[' + n.elements.map(visit).join(',') + ']';
      },

    BinaryExpression: function(n) {
        return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
      },

    UnaryExpression: function(n) {
        return '(' + n.operator + visit(n.argument) + ')';
      },

    ConditionalExpression: function(n) {
        return '(' + visit(n.test) +
          '?' + visit(n.consequent) +
          ':' + visit(n.alternate) +
          ')';
      },

    LogicalExpression: function(n) {
        return '(' + visit(n.left) + n.operator + visit(n.right) + ')';
      },

    ObjectExpression: function(n) {
        return '{' + n.properties.map(visit).join(',') + '}';
      },

    Property: function(n) {
        memberDepth += 1;
        var k = visit(n.key);
        memberDepth -= 1;
        return k + ':' + visit(n.value);
      }
  };

  function codegen(ast) {
    var result = {
      code:    visit(ast),
      globals: Object.keys(globals),
      fields:  Object.keys(fields)
    };
    globals = {};
    fields = {};
    return result;
  }

  codegen.functions = functions;
  codegen.constants = constants;

  return codegen;
}

var scalePrefix  = '%';

var Literal = 'Literal';
var Identifier = 'Identifier';
var indexPrefix  = '@';
var tuplePrefix  = ':';
var eventPrefix  = 'event.vega.';
var thisPrefix   = 'this.';
// Expression Functions

var eventFunctions = ['view', 'item', 'group', 'xy', 'x', 'y'];

var scaleFunctions = ['bandwidth', 'copy', 'domain', 'range', 'gradient', 'invert', 'scale'];

function getScale(name, ctx) {
  var s = isString(name) ? ctx.scales[name]
    : isObject(name) && name.signal ? ctx.signals[name.signal]
    : undefined;
  return s && s.value;
}

function formatter(method) {
  var cache = {};
  return function(specifier, _) {
    var f = cache[specifier] || (cache[specifier] = method(specifier));
    return f(_);
  };
}

function expressionFunctions(codegen) {
  var fn = Functions(codegen);
  eventFunctions.forEach(function(name) {
    fn[name] = eventPrefix + name;
  });
  for (var name in extendedFunctions) {
    fn[name] = thisPrefix + name;
  }
  return fn;
}

var extendedFunctions = {
  format: formatter(format),
  timeFormat: formatter(timeFormat),
  utcFormat: formatter(utcFormat),
  pad: pad,
  truncate: truncate,

  rgb: rgb,
  lab: lab,
  hcl: hcl,
  hsl: hsl,
  gradient: scaleGradient,

  clampRange: function(range, min, max) {
      var lo = range[0],
          hi = range[1],
          span;

      if (hi < lo) span = hi, hi = lo, lo = span;
      span = hi - lo;

      return [
        Math.min(Math.max(lo, min), max - span),
        Math.min(Math.max(hi, span), max)
      ];
    },

  pinchDistance: function() {
      return 'Math.sqrt('
        + 'Math.pow(event.touches[0].clientX - event.touches[1].clientX, 2) + '
        + 'Math.pow(event.touches[0].clientY - event.touches[1].clientY, 2)'
        + ')';
    },

  pinchAngle: function() {
      return 'Math.atan2('
        + 'event.touches[1].clientY - event.touches[0].clientY,'
        + 'event.touches[1].clientX - event.touches[0].clientX'
        + ')';
    },

  open: function(uri, name) {
      var df = this.context.dataflow;
      if (typeof window !== 'undefined' && window && window.open) {
        df.loader().sanitize(uri, {context:'open', name:name})
          .then(function(url) { window.open(url, name); })
          .catch(function(e) { df.warn('Open url failed: ' + e); });
      } else {
        df.warn('Open function can only be invoked in a browser.');
      }
    },

  screen: function() { return window.screen; },

  windowsize: function() { return [window.innerWidth, window.innerHeight]; },

  span: function(array) { return array[array.length-1] - array[0]; },

  range: function(name, group) {
    var s = getScale(name, (group || this).context);
    return s && s.range ? s.range() : [0, 0];
  },

  domain: function(name, group) {
    var s = getScale(name, (group || this).context);
    return s ? s.domain() : [];
  },

  bandwidth: function(name, group) {
      var s = getScale(name, (group || this).context);
      return s && s.bandwidth ? s.bandwidth() : 0;
    },

  copy: function(name, group) {
      var s = getScale(name, (group || this).context);
      return s ? s.copy() : undefined;
    },

  scale:  function(name, value, group) {
      var s = getScale(name, (group || this).context);
      return s ? s(value) : undefined;
    },

  invert: function(name, range, group) {
      var s = getScale(name, (group || this).context);
      return !s ? undefined
        : isArray(range) ? (s.invertRange || s.invert)(range)
        : (s.invert || s.invertExtent)(range);
    },

  tuples: function(name) {
      var data = this.context.data[name];
      return data ? data.values.value : [];
    },

  indata: function(name, field, value) {
      var index = this.context.data[name]['index:' + field],
          entry = index ? index.value[value] : undefined;
      return entry ? entry.count : entry;
    },

  inrange: function(value, range) {
      var r0 = range[0], r1 = range[range.length-1], t;
      if (r0 > r1) t = r0, r0 = r1, r1 = t;
      return r0 <= value && value <= r1;
    },

  encode: function(item, name, retval) {
      if (item) {
        var df = this.context.dataflow,
            target = item.mark.source;
        df.pulse(target, df.changeset().encode(item, name));
      }
      return retval !== undefined ? retval : item;
    },

  modify: function(name, insert, remove, toggle, modify, values) {
      var df = this.context.dataflow,
          data = this.context.data[name],
          input = data.input,
          changes = data.changes,
          stamp = df.stamp(),
          predicate, key;

      if (!(input.value.length || insert || toggle)) {
        // nothing to do!
        return 0;
      }

      if (!changes || changes.stamp < stamp) {
        data.changes = (changes = df.changeset());
        changes.stamp = stamp;
        df.runAfter(function() { df.pulse(input, changes).run(); });
      }

      if (remove) {
        changes.remove(remove === true ? truthy : remove);
      }

      if (insert) {
        changes.insert(insert);
      }

      if (toggle) {
        predicate = function(_) {
          for (key in toggle) {
            if (_[key] !== toggle[key]) return false;
          }
          return true;
        };

        if (input.value.filter(predicate).length) {
          changes.remove(predicate);
        } else {
          changes.insert(toggle);
        }
      }

      if (modify) {
        for (key in values) {
          changes.modify(modify, key, values[key]);
        }
      }

      return 1;
    }
};


// AST visitors for dependency analysis

function scaleVisitor(name, args, scope, params) {
  if (args[0].type === Literal) { // scale dependency
    name = args[0].value;
    var scaleName = scalePrefix + name;

    if (!params.hasOwnProperty(scaleName)) {
      try {
        params[scaleName] = scope.scaleRef(name);
      } catch (err) {
        // TODO: error handling? warning?
      }
    }
  }

  else if (args[0].type === Identifier) { // forward reference to signal
    name = args[0].name;
    args[0] = new ASTNode(Literal);
    args[0].raw = '{signal:"' + name + '"}';
  }
}

function indataVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to indata must be a string literal.');
  if (args[1].type !== Literal) error('Second argument to indata must be a string literal.');

  var data = args[0].value,
      field = args[1].value,
      indexName = indexPrefix + field;

  if (!params.hasOwnProperty(indexName)) {
    params[indexName] = scope.getData(data).indataRef(scope, field);
  }
}

function tuplesVisitor(name, args, scope, params) {
  if (args[0].type !== Literal) error('First argument to tuples must be a string literal.');

  var data = args[0].value,
      dataName = tuplePrefix + data;

  if (!params.hasOwnProperty(dataName)) {
    params[dataName] = scope.getData(data).tuplesRef();
  }
}

function visitors() {
  var v = {
    indata: indataVisitor,
    tuples: tuplesVisitor
  };
  scaleFunctions.forEach(function(_) { v[_] = scaleVisitor; });
  return v;
}

// Export code generator parameters
var codegenParams = {
  blacklist:  ['_'],
  whitelist:  ['datum', 'event'],
  fieldvar:   'datum',
  globalvar:  function(id) { return '_[' + $('$' + id) + ']'; },
  functions:  expressionFunctions,
  constants:  Constants,
  visitors:   visitors()
};

var signalPrefix = '$';
var generator = codegen(codegenParams);

function parseExpression(expr, scope, preamble) {
  var params = {}, ast, gen;

  // parse the expression to an abstract syntax tree (ast)
  try {
    ast = parse$4(expr);
  } catch (err) {
    error('Expression parse error: ' + expr);
  }

  // analyze ast function calls for dependencies
  ast.visit(function visitor(node) {
    if (node.type !== 'CallExpression') return;
    var name = node.callee.name,
        visit = codegenParams.visitors[name];
    if (visit) visit(name, node.arguments, scope, params);
  });

  // perform code generation
  gen = generator(ast);

  // collect signal dependencies
  gen.globals.forEach(function(name) {
    var signalName = signalPrefix + name;
    if (!params.hasOwnProperty(signalName) && scope.getSignal(name)) {
      params[signalName] = scope.signalRef(name);
    }
  });

  // return generated expression code and dependencies
  return {
    $expr:   preamble ? preamble + 'return(' + gen.code + ');' : gen.code,
    $fields: gen.fields,
    $params: params
  };
}

var GroupMark = 'group';
var RectMark = 'rect';
var RuleMark = 'rule';
var SymbolMark = 'symbol';
var TextMark = 'text';

var marktypes = toSet([
  '*',
  'arc',
  'area',
  'group',
  'image',
  'line',
  'path',
  'rect',
  'rule',
  'shape',
  'symbol',
  'text'
]);

function isMarkType(type) {
  return marktypes.hasOwnProperty(type);
}

/**
 * Parse an event selector string.
 * Returns an array of event stream definitions.
 */
function parseSelector(selector) {
  return parseMerge(selector.trim())
    .map(parseSelector$1);
}

var LBRACK = '[';
var RBRACK = ']';
var LBRACE = '{';
var RBRACE = '}';
var COLON  = ':';
var COMMA  = ',';
var GT = '>';
var ILLEGAL$1 = /[\[\]\{\}]/;

function find$2(s, i, endChar, pushChar, popChar) {
  var count = 0,
      n = s.length,
      c;
  for (; i<n; ++i) {
    c = s[i];
    if (popChar && popChar.indexOf(c) >= 0) --count;
    if (c === endChar && !count) return i;
    else if (pushChar && pushChar.indexOf(c) >= 0) ++count;
  }
  return i;
}

function parseMerge(s) {
  var output = [],
      start = 0,
      n = s.length,
      i = 0;

  while (i < n) {
    i = find$2(s, i, COMMA, LBRACK + LBRACE, RBRACK + RBRACE);
    output.push(s.substring(start, i).trim());
    start = ++i;
  }

  if (output.length === 0) {
    throw 'Empty event selector: ' + s;
  }
  return output;
}

function parseSelector$1(s) {
  return s[0] === '['
    ? parseBetween(s)
    : parseStream(s);
}

function parseBetween(s) {
  var start = 1,
      n = s.length,
      i = 1,
      b, stream;

  i = find$2(s, i, RBRACK, LBRACK);
  if (i === n) {
    throw 'Empty between selector: ' + s;
  }

  b = parseMerge(s.substring(start, i));
  if (b.length !== 2) {
    throw 'Between selector must have two elements: ' + s;
  }

  s = s.slice(i + 1).trim();
  if (s[0] !== GT) {
    throw 'Expected \'>\' after between selector: ' + s;
  }

  b = b.map(parseSelector$1);

  stream = parseSelector$1(s.slice(1).trim());
  if (stream.between) {
    return {
      between: b,
      stream: stream
    };
  } else {
    stream.between = b;
  }

  return stream;
}

function parseStream(s) {
  var stream = {source: 'view'},
      source = [],
      throttle = [0, 0],
      markname = 0,
      start = 0,
      n = s.length,
      i = 0, j,
      filter;

  // extract throttle from end
  if (s[n-1] === RBRACE) {
    i = s.lastIndexOf(LBRACE);
    if (i >= 0) {
      try {
        throttle = parseThrottle(s.substring(i+1, n-1));
      } catch (e) {
        throw 'Invalid throttle specification: ' + s;
      }
      s = s.slice(0, i).trim();
      n = s.length;
    } else throw 'Unmatched right brace: ' + s;
    i = 0;
  }

  if (!n) throw s;

  // set name flag based on first char
  if (s[0] === '@') markname = ++i;

  // extract first part of multi-part stream selector
  j = find$2(s, i, COLON);
  if (j < n) {
    source.push(s.substring(start, j).trim());
    start = i = ++j;
  }

  // extract remaining part of stream selector
  i = find$2(s, i, LBRACK);
  if (i === n) {
    source.push(s.substring(start, n).trim());
  } else {
    source.push(s.substring(start, i).trim());
    filter = [];
    start = ++i;
    if (start === n) throw 'Unmatched left bracket: ' + s;
  }

  // extract filters
  while (i < n) {
    i = find$2(s, i, RBRACK);
    if (i === n) throw 'Unmatched left bracket: ' + s;
    filter.push(s.substring(start, i).trim());
    if (i < n-1 && s[++i] !== LBRACK) throw 'Expected left bracket: ' + s;
    start = ++i;
  }

  // marshall event stream specification
  if (!(n = source.length) || ILLEGAL$1.test(source[n-1])) {
    throw 'Invalid event selector: ' + s;
  }

  if (n > 1) {
    stream.type = source[1];
    if (markname) {
      stream.markname = source[0].slice(1);
    } else if (isMarkType(source[0])) {
      stream.marktype = source[0];
    } else {
      stream.source = source[0];
    }
  } else {
    stream.type = source[0];
  }
  if (stream.type.slice(-1) === '!') {
    stream.consume = true;
    stream.type = stream.type.slice(0, -1)
  }
  if (filter != null) stream.filter = filter;
  if (throttle[0]) stream.throttle = throttle[0];
  if (throttle[1]) stream.debounce = throttle[1];

  return stream;
}

function parseThrottle(s) {
  var a = s.split(COMMA);
  if (!s.length || a.length > 2) throw s;
  return a.map(function(_) {
    var x = +_;
    if (x !== x) throw s;
    return x;
  });
}

var View$1 = 'view';

function parseStream$1(stream, scope) {
  return stream.signal
    ? scope.getSignal(stream.signal).id
    : parseStream$2(stream, scope);
}

function parseStream$2(stream, scope) {
  var method = stream.merge ? mergeStream
    : stream.stream ? nestedStream
    : stream.type ? eventStream
    : error('Invalid stream specification: ' + JSON.stringify(stream));

  return method(stream, scope);
}

function mergeStream(stream, scope) {
  var list = stream.merge.map(function(s) {
    return parseStream$2(s, scope);
  });

  var entry = streamParameters({merge: list}, stream, scope);
  return scope.addStream(entry).id;
}

function nestedStream(stream, scope) {
  var id = parseStream$2(stream.stream, scope),
      entry = streamParameters({stream: id}, stream, scope);
  return scope.addStream(entry).id;
}

function eventStream(stream, scope) {
  var id = scope.event(stream.source || View$1, stream.type),
      entry = streamParameters({stream: id}, stream, scope);
  return Object.keys(entry).length === 1 ? id
    : scope.addStream(entry).id;
}

function streamParameters(entry, stream, scope) {
  var param, mark;

  if (param = stream.between) {
    if (param.length !== 2) {
      error('Stream between parameter must have 2 entries.');
    }
    entry.between = [
      parseStream$2(param[0], scope),
      parseStream$2(param[1], scope)
    ];
  }

  mark = stream.marktype || stream.markname;
  if (stream.filter || mark) {
    param = stream.filter ? array$1(stream.filter) : [];
    if (mark) {
      param.push(filterMark(stream.marktype, stream.markname));
    }
    entry.filter = parseExpression('(' + param.join(')&&(') + ')').$expr;
  }

  if ((param = stream.throttle) != null) {
    entry.throttle = +param;
  }

  if ((param = stream.debounce) != null) {
    entry.debounce = +param;
  }

  if (stream.consume) {
    entry.consume = true;
  }

  return entry;
}

function filterMark(type, name) {
  var item = 'event.item';
  return item
    + (type && type !== '*' ? '&&' + item + '.mark.marktype===\'' + type + '\'' : '')
    + (name ? '&&' + item + '.mark.name===\'' + name + '\'' : '');
}

var preamble = 'var datum=event.item&&event.item.datum;';

function parseUpdate(spec, scope, target) {
  var events = spec.events,
      update = spec.update,
      encode = spec.encode,
      sources = [],
      value = '', entry;

  if (!events) {
    error('Signal update missing events specification.');
  }

  // interpret as an event selector string
  if (isString(events)) {
    events = parseSelector(events);
  }

  // separate event streams from signal updates
  events = array$1(events).filter(function(stream) {
    return stream.signal ? (sources.push(stream), 0) : 1;
  });

  // merge event streams, include as source
  if (events.length) {
    sources.push(events.length > 1 ? {merge: events} : events[0]);
  }

  if (encode != null) {
    if (update) error('Signal encode and update are mutually exclusive.');
    update = 'encode(item(),' + $(encode) + ')';
  }

  // resolve update value
  value = isString(update) ? parseExpression(update, scope, preamble)
    : update.expr != null ? parseExpression(update.expr, scope, preamble)
    : update.value != null ? update.value
    : update.signal != null ? {
        $expr:   '_.value',
        $params: {value: scope.signalRef(update.signal)}
      }
    : error('Invalid signal update specification.');

  entry = {
    target: target,
    update: value
  };

  if (spec.force) {
    entry.options = {force: true};
  }

  sources.forEach(function(source) {
    source = {source: parseStream$1(source, scope)};
    scope.addUpdate(extend(source, entry));
  });
}

function parseSignalUpdates(signal, scope) {
  var op = scope.getSignal(signal.name);

  if (signal.update) {
    var expr = parseExpression(signal.update, scope);
    op.update = expr.$expr;
    op.params = expr.$params;
  }

  if (signal.on) {
    signal.on.forEach(function(_) {
      parseUpdate(_, scope, op.id);
    });
  }
}

function parseProjection(proj, scope) {
  var params = {};

  for (var name in proj) {
    if (name === 'name') continue;
    params[name] = parseParameter(proj[name], scope);
  }

  scope.addProjection(proj.name, params);
}

function parseParameter(_, scope) {
  return isArray(_) ? _.map(function(_) { return parseParameter(_, scope); })
    : !isObject(_) ? _
    : _.signal ? scope.signalRef(_.signal)
    : error('Unsupported parameter object: ' + JSON.stringify(_));
}

var Skip = toSet(['rule']);

function adjustSpatial(encode, marktype) {
  var code = '';

  if (Skip[marktype]) return code;

  if (encode.x2) {
    if (encode.x) {
      code += 'if(o.x>o.x2)$=o.x,o.x=o.x2,o.x2=$;';
      code += 'o.width=o.x2-o.x;'
    } else if (encode.width) {
      code += 'o.x=o.x2-o.width;';
    } else {
      code += 'o.x=o.x2;';
    }
  }

  if (encode.xc) {
    if (encode.width) {
      code += 'o.x=o.xc-o.width/2;';
    } else {
      code += 'o.x=o.xc;';
    }
  }

  if (encode.y2) {
    if (encode.y) {
      code += 'if(o.y>o.y2)$=o.y,o.y=o.y2,o.y2=$;';
      code += 'o.height=o.y2-o.y;'
    } else if (encode.height) {
      code += 'o.y=o.y2-o.height;';
    } else {
      code += 'o.y=o.y2;';
    }
  }

  if (encode.yc) {
    if (encode.height) {
      code += 'o.y=o.yc-o.height/2;';
    } else {
      code += 'o.y=o.yc;';
    }
  }

  return code;
}

function color$3(enc, scope, params, fields) {
  function color(type, x, y, z) {
    var a = entry(null, x, scope, params, fields),
        b = entry(null, y, scope, params, fields),
        c = entry(null, z, scope, params, fields);

    // TODO put color functions in scope
    return 'this.' + type + '(' + [a, b, c].join(',') + ').toString()';
  }

  return (enc.c) ? color('hcl', enc.h, enc.c, enc.l)
    : (enc.h || enc.s) ? color('hsl', enc.h, enc.s, enc.l)
    : (enc.l || enc.a) ? color('lab', enc.l, enc.a, enc.b)
    : (enc.r || enc.g || enc.b) ? color('rgb', enc.r, enc.g, enc.b)
    : null;
}

function expression(code, scope, params, fields) {
  var expr = parseExpression(code, scope);
  expr.$fields.forEach(function(name) { fields[name] = 1; });
  extend(params, expr.$params);
  return expr.$expr;
}

function field$1(ref, scope, params, fields) {
  return resolve$1(isObject(ref) ? ref : {datum: ref}, scope, params, fields);
}

function resolve$1(ref, scope, params, fields) {
  var object, level, field;

  if (ref.signal) {
    object = 'datum';
    field = expression(ref.signal, scope, params, fields);
  } else if (ref.group || ref.parent) {
    level = Math.max(1, ref.level || 1);
    object = 'item';

    while (level-- > 0) {
      object += '.mark.group';
    }

    if (ref.parent) {
      field = ref.parent;
      object += '.datum';
    } else {
      field = ref.group;
    }
  } else if (ref.datum) {
    object = 'datum';
    field = ref.datum;
  } else {
    error('Invalid field reference: ' + JSON.stringify(ref));
  }

  if (!ref.signal) {
    if (isString(field)) {
      fields[field] = 1; // TODO review field tracking?
      field = splitAccessPath(field).map($).join('][');
    } else {
      field = resolve$1(field, scope, params, fields);
    }
  }

  return object + '[' + field + ']';
}

function scale$2(enc, value, scope, params, fields) {
  var scale = getScale$1(enc.scale, scope, params, fields),
      interp, func, flag;

  if (enc.range != null) {
    // pull value from scale range
    interp = +enc.range;
    func = scale + '.range()';
    value = (interp === 0) ? (func + '[0]')
      : '($=' + func + ',' + ((interp === 1) ? '$[$.length-1]'
      : '$[0]+' + interp + '*($[$.length-1]-$[0])') + ')';
  } else {
    // run value through scale and/or pull scale bandwidth
    value = value != null ? scale + '(' + value + ')' : null;

    if (enc.band && (flag = hasBandwidth(enc.scale, scope))) {
      func = scale + '.bandwidth';
      interp = +enc.band;
      interp = func + '()' + (interp===1 ? '' : '*' + interp);

      // if we don't know the scale type, check for bandwidth
      if (flag < 0) interp = '(' + func + '?' + interp + ':0)';

      value = (value ? value + '+' : '') + interp;

      if (enc.extra) {
        // include logic to handle extraneous elements
        value = '(datum.extra?' + scale + '(datum.extra.value):' + value + ')';
      }
    }

    if (value == null) value = '0';
  }

  return value;
}

function hasBandwidth(name, scope) {
  if (!isString(name)) return -1;
  var type = scope.scaleType(name);
  return type === 'band' || type === 'point' ? 1 : 0;
}

function getScale$1(name, scope, params, fields) {
  var scaleName;

  if (isString(name)) {
    // direct scale lookup; add scale as parameter
    scaleName = scalePrefix + name;
    if (!params.hasOwnProperty(scaleName)) {
      params[scaleName] = scope.scaleRef(name);
    }
    scaleName = $(scaleName);
  } else {
    // indirect scale lookup; add all scales as parameters
    for (scaleName in scope.scales) {
      params[scalePrefix + scaleName] = scope.scaleRef(scaleName);
    }
    scaleName = $(scalePrefix) + '+'
      + field$1(name, scope, params, fields);
  }

  return '_[' + scaleName + ']';
}

function gradient$1(enc, scope, params, fields) {
  return 'this.gradient('
    + getScale$1(enc.gradient, scope, params, fields)
    + ',' + $(enc.start)
    + ',' + $(enc.stop)
    + ',' + $(enc.count)
    + ')';
}

function property(property, scope, params, fields) {
  return isObject(property)
      ? '(' + entry(null, property, scope, params, fields) + ')'
      : property;
}

function entry(channel, enc, scope, params, fields) {
  if (enc.gradient != null) {
    return gradient$1(enc, scope, params, fields);
  }

  var value = (enc.color != null) ? color$3(enc.color, scope, params, fields)
    : (enc.field != null) ? field$1(enc.field, scope, params, fields)
    : (enc.signal != null) ? expression(enc.signal, scope, params, fields)
    : (enc.value != null) ? $(enc.value)
    : null;

  if (enc.scale != null) {
    value = scale$2(enc, value, scope, params, fields);
  }

  if (enc.exponent != null) {
    value = 'Math.pow(' + value + ','
      + property(enc.exponent, scope, params, fields) + ')';
  }

  if (enc.mult != null) {
    value += '*' + property(enc.mult, scope, params, fields);
  }

  if (enc.offset != null) {
    value += '+' + property(enc.offset, scope, params, fields);
  }

  if (enc.round) {
    value = 'Math.round(' + value + ')';
  }

  return value;
}

function set$6(obj, key, value) {
  return obj + '[' + $(key) + ']=' + value + ';';
}

function rule$1(channel, rules, scope, params, fields) {
  var code = '';

  rules.forEach(function(rule) {
    var value = entry(channel, rule, scope, params, fields);
    code += rule.test
      ? expression(rule.test, scope, params, fields) + '?' + value + ':'
      : value;
  });

  return set$6('o', channel, code);
}

function parseEncode(encode, marktype, params, scope) {
  var fields = {},
      code = 'var o=item,datum=o.datum,$;',
      channel, enc, value;

  for (channel in encode) {
    enc = encode[channel];
    if (isArray(enc)) { // rule
      code += rule$1(channel, enc, scope, params, fields);
    } else {
      value = entry(channel, enc, scope, params, fields);
      code += set$6('o', channel, value);
    }
  }

  code += adjustSpatial(encode, marktype);
  code += 'return 1;';

  return {
    $expr:   code,
    $fields: Object.keys(fields),
    $output: Object.keys(encode)
  };
}

var MarkRole = 'mark';
var FrameRole$1 = 'frame';
var ScopeRole$1 = 'scope';

var AxisRole$1 = 'axis';
var AxisDomainRole = 'axis-domain';
var AxisGridRole = 'axis-grid';
var AxisLabelRole = 'axis-label';
var AxisTickRole = 'axis-tick';
var AxisTitleRole = 'axis-title';

var LegendRole$1 = 'legend';
var LegendEntryRole = 'legend-entry';
var LegendGradientRole = 'legend-gradient';
var LegendLabelRole = 'legend-label';
var LegendSymbolRole = 'legend-symbol';
var LegendTitleRole = 'legend-title';

function encoder(_) {
  return isObject(_) ? _ : {value: _};
}

function extendEncode(encode, extra) {
  for (var name in extra) {
    if (name === 'interactive') continue;
    encode[name] = extend(encode[name] || {}, extra[name]);
  }
  return encode;
}

function encoders(encode, type, role, scope, params) {
  var enc, key;
  params = params || {};
  params.encoders = {$encode: (enc = {})};

  encode = applyDefaults(encode, type, role, scope.config);

  for (key in encode) {
    enc[key] = parseEncode(encode[key], type, params, scope);
  }

  return params;
}

function applyDefaults(encode, type, role, config) {
  var enter, key, skip;

  config = config && (role === FrameRole$1 ? config.group
    : role === MarkRole ? config.mark && config.mark[type]
    : null);

  if (config) {
    enter = {};
    for (key in config) {
      // do not apply defaults if relevant fields are defined
      skip = has(key, encode)
        || (key === 'fill' || key === 'stroke')
        && (has('fill', encode) || has('stroke', encode));

      if (!skip) enter[key] = {value: config[key]};
    }

    encode = extend({}, encode); // defensive copy
    encode.enter = extend(enter, encode.enter);
  }

  return encode;
}

function has(key, encode) {
  return (encode.enter && encode.enter[key])
    || (encode.update && encode.update[key]);
}

function guideMark(type, role, key, dataRef, encode, extras) {
  return {
    type: type,
    role: role,
    key:  key,
    from: dataRef,
    interactive: !!(extras && extras.interactive),
    encode: extendEncode(encode, extras)
  };
}

function legendGradient(scale, config, userEncode) {
  var zero = {value: 0},
      encode = {};

  encode.enter = {
    opacity: zero,
    x: zero,
    y: zero,
    width: {value: config.gradientWidth},
    height: {value: config.gradientHeight},
    stroke: {value: config.gradientStrokeColor},
    strokeWidth: {value: config.gradientStrokeWidth}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    x: zero,
    y: zero,
    width: {value: config.gradientWidth},
    height: {value: config.gradientHeight},
    fill: {gradient: scale},
    opacity: {value: 1}
  };

  return guideMark(RectMark, LegendGradientRole, undefined, undefined, encode, userEncode);
}

var Top = 'top';
var Left = 'left';
var Right = 'right';
var Bottom = 'bottom';

var Index = 'index';
var Label = 'label';
var Perc  = 'perc';
var Size  = 'size';
var Total = 'total';
var Value = 'value';

var alignExpr = 'datum.' + Perc + '<=0?"left"'
  + ':datum.' + Perc + '>=1?"right":"center"';

function legendGradientLabels(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    text: {field: Label},
    fill: {value: config.labelColor},
    font: {value: config.labelFont},
    fontSize: {value: config.labelFontSize},
    baseline: {value: config.gradientLabelBaseline}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field: Perc,
    mult: config.gradientWidth
  };

  enter.y = update.y = {
    value: config.gradientHeight,
    offset: config.gradientLabelOffset
  };

  enter.align = update.align = {signal: alignExpr};

  return guideMark(TextMark, LegendLabelRole, Label, dataRef, encode, userEncode);
}

function legendLabels(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    fill: {value: config.labelColor},
    text: {field: Label},
    font: {value: config.labelFont},
    fontSize: {value: config.labelFontSize},
    align: {value: config.labelAlign},
    baseline: {value: config.labelBaseline}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field:  Size,
    offset: config.labelOffset
  };

  enter.y = update.y = {
    field:  Size,
    mult:   0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };

  return guideMark(TextMark, LegendLabelRole, Label, dataRef, encode, userEncode);
}

function legendSymbols(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    shape: {value: config.symbolType},
    size: {value: config.symbolSize},
    strokeWidth: {value: config.symbolStrokeWidth}
  };

  if (!spec.fill) {
    enter.stroke = {value: config.symbolColor};
  }

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  enter.x = update.x = {
    field: Size,
    mult:  0.5
  };

  enter.y = update.y = {
    field: Size,
    mult:  0.5,
    offset: {
      field: Total,
      offset: {
        field: {group: 'entryPadding'},
        mult: {field: Index}
      }
    }
  };

  ['shape', 'size', 'fill', 'stroke', 'opacity'].forEach(function(scale) {
    if (spec[scale]) {
      update[scale] = enter[scale] = {scale: spec[scale], field: Value};
    }
  });

  return guideMark(SymbolMark, LegendSymbolRole, Label, dataRef, encode, userEncode);
}

function legendTitle(spec, config, userEncode, dataRef) {
  var zero = {value: 0},
      encode = {};

  encode.enter = {
    x: {field: {group: 'padding'}},
    y: {field: {group: 'padding'}},
    opacity: zero,
    fill: {value: config.titleColor},
    font: {value: config.titleFont},
    fontSize: {value: config.titleFontSize},
    fontWeight: {value: config.titleFontWeight},
    align: {value: config.titleAlign},
    baseline: {value: config.titleBaseline}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = {
    opacity: {value: 1},
    text: {field: 'title'}
  };

  return guideMark(TextMark, LegendTitleRole, null, dataRef, encode, userEncode);
}

function guideGroup(role, dataRef, interactive, encode, marks) {
  return {
    type: GroupMark,
    role: role,
    from: dataRef,
    interactive: interactive,
    encode: encode,
    marks: marks
  };
}

function role(spec) {
  return spec.role ||
    (spec.type === GroupMark && (spec.legends || spec.axes)
      ? ScopeRole$1
      : MarkRole);
}

function definition$1(spec) {
  return {
    clip:        spec.clip || false,
    interactive: spec.interactive === false ? false : true,
    marktype:    spec.type,
    name:        spec.name || undefined,
    role:        role(spec),
    zindex:      +spec.zindex || undefined
  };
}

function dataName(name) {
  return name;
}

function Entry(type, value, params, parent) {
  this.id = -1,
  this.type = type;
  this.value = value;
  this.params = params;
  if (parent) this.parent = parent;
}

function entry$1(type, value, params, parent) {
  return new Entry(type, value, params, parent);
}

function operator(value, params) {
  return entry$1('Operator', value, params);
}

// -----

function ref(op) {
  return {$ref: op.id};
}

function fieldRef(field, name) {
  return name ? {$field: field, $name: name} : {$field: field};
}

var keyFieldRef = fieldRef('key');

function compareRef(fields, orders) {
  return {$compare: fields, $order: orders};
}

function keyRef(fields) {
  return {$key: fields};
}

// -----

var Ascending  = 'ascending';

var Descending = 'descending';

function sortKey(sort) {
  return !isObject(sort) ? ''
    : (sort.order === Descending ? '-' : '+')
      + aggrField(sort.op, sort.field);
}

function aggrField(op, field) {
  return (op && op.signal ? '$' + op.signal : op || '')
    + (op && field ? '_' : '')
    + (field && field.signal ? '$' + field.signal : field || '');
}

// -----

function isSignal(_) {
  return _ && _.signal;
}

function transform$3(name) {
  return function(params, value, parent) {
    return entry$1(name, value, params || undefined, parent);
  };
}

var Aggregate$1 = transform$3('Aggregate');
var AxisTicks$1 = transform$3('AxisTicks');
var Bound$1 = transform$3('Bound');
var Collect$1 = transform$3('Collect');
var Compare$1 = transform$3('Compare');
var DataJoin$1 = transform$3('DataJoin');
var Encode$1 = transform$3('Encode');
var Facet$1 = transform$3('Facet');
var Field$1 = transform$3('Field');
var Key$1 = transform$3('Key');
var LegendEntries$1 = transform$3('LegendEntries');
var Mark$1 = transform$3('Mark');
var MultiExtent$1 = transform$3('MultiExtent');
var MultiValues$1 = transform$3('MultiValues');
var Params$1 = transform$3('Params');
var PreFacet$1 = transform$3('PreFacet');
var Projection$1 = transform$3('Projection');
var Relay$1 = transform$3('Relay');
var Render$1 = transform$3('Render');
var Scale$1 = transform$3('Scale');
var Sieve$1 = transform$3('Sieve');
var ViewLayout$1 = transform$3('ViewLayout');
var Values$1 = transform$3('Values');

/**
 * Parse a data transform specification.
 */
function parseTransform(spec, scope) {
  var def = definition(spec.type);
  if (!def) error('Unrecognized transform type: ' + spec.type);

  var t = entry$1(def.type, null, parseParameters(def, spec, scope));
  if (spec.signal) scope.addSignal(spec.signal, t);
  return t.metadata = def.metadata || {}, t;
}

/**
 * Parse all parameters of a data transform.
 */
function parseParameters(def, spec, scope) {
  var params = {}, pdef, i, n;
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    params[pdef.name] = parseParameter$1(pdef, spec, scope);
  }
  return params;
}

/**
 * Parse a data transform parameter.
 */
function parseParameter$1(def, spec, scope) {
  var type = def.type, value;

  if (type === 'index') {
    return parseIndexParameter(def, spec, scope);
  } else if (type === 'param') {
    return parseSubParameters(def, spec, scope);
  } else if (type === 'projection') {
    return scope.projectionRef(spec[def.name]);
  } else {
    value = spec[def.name];
    if (value === undefined) {
      if (def.required) error('Missing required parameter: ' + def.name);
      return;
    }

    return def.array && !isSignal(value)
      ? value.map(function(v) { return parameterValue(def, v, scope); })
      : parameterValue(def, value, scope);
  }
}

/**
 * Parse a single parameter value.
 */
function parameterValue(def, value, scope) {
  var type = def.type;

  if (isSignal(value)) {
    return isExpr(type) ? error('Expression references can not be signals.')
         : isField(type) ? scope.fieldRef(value)
         : isCompare(type) ? scope.compareRef(value)
         : scope.signalRef(value.signal);
  } else {
    var expr = def.expr || isField(type);
    return expr && outerExpr(value) ? parseExpression(value.expr, scope)
         : expr && outerField(value) ? fieldRef(value.field)
         : isExpr(type) ? parseExpression(value, scope)
         : isData(type) ? ref(scope.getData(value).values)
         : isField(type) ? fieldRef(value)
         : isCompare(type) ? compareRef(array$1(value.field), array$1(value.order))
         : value;
  }
}

/**
 * Parse parameter for accessing an index of another data set.
 */
function parseIndexParameter(def, spec, scope) {
  if (!isString(spec.from)) {
    error('Lookup "from" parameter must be a string literal.');
  }
  return scope.getData(spec.from).lookupRef(scope, spec.key);
}

/**
 * Parse a parameter that contains one or more sub-parameter objects.
 */
function parseSubParameters(def, spec, scope) {
  var value = spec[def.name];

  if (def.array) {
    if (!isArray(value)) { // signals not allowed!
      error('Expected an array of sub-parameters. Instead: ' + value);
    }
    return value.map(function(v) {
      return parseSubParameter(def, v, scope);
    });
  } else {
    return parseSubParameter(def, value, scope);
  }
}

/**
 * Parse a sub-parameter object.
 */
function parseSubParameter(def, value, scope) {
  var params, pdef, k, i, n;

  // loop over defs to find matching key
  for (i=0, n=def.params.length; i<n; ++i) {
    pdef = def.params[i];
    for (k in pdef.key) {
      if (pdef.key[k] !== value[k]) { pdef = null; break; }
    }
    if (pdef) break;
  }
  // raise error if matching key not found
  if (!pdef) error('Unsupported parameter: ' + JSON.stringify(value));

  // parse params, create Params transform, return ref
  params = extend(parseParameters(pdef, value, scope), pdef.key);
  return ref(scope.add(Params$1(params)));
}

// -- Utilities -----

function outerExpr(_) {
  return _ && _.expr;
}

function outerField(_) {
  return _ && _.field;
}

function isData(_) {
  return _ === 'data';
}

function isExpr(_) {
  return _ === 'expr';
}

function isField(_) {
  return _ === 'field';
}

function isCompare(_) {
  return _ === 'compare'
}

function parseData(from, group, scope) {
  var facet, key, op, dataRef;

  // if no source data, generate singleton datum
  if (!from) {
    dataRef = ref(scope.add(Collect$1(null, [{}])));
  }

  // if faceted, process facet specification
  else if (facet = from.facet) {
    if (!group) error('Only group marks can be faceted.');

    // use pre-faceted source data, if available
    if (facet.field != null) {
      dataRef = ref(scope.getData(facet.data).output);
    } else {
      key = scope.keyRef(facet.groupby);

      // generate facet aggregates if no direct data specification
      if (!from.data) {
        op = parseTransform(extend({
          type:    'aggregate',
          groupby: array$1(facet.groupby)
        }, facet.aggregate));
        op.params.key = key;
        op.params.pulse = ref(scope.getData(facet.data).output);
        dataRef = ref(scope.add(op));
      }
    }
  }

  // if not yet defined, get source data reference
  if (!dataRef) {
    dataRef = from.$ref ? from
      : from.mark ? ref(scope.getData(dataName(from.mark)).output)
      : ref(scope.getData(from.data).output);
  }

  return {key: key, pulse: dataRef};
}

function DataScope(scope, input, output, values) {
  this.scope = scope;
  this.input = input;
  this.output = output;
  this.values = values;
  this.index = {};
}

DataScope.fromEntries = function(scope, entries) {
  var n = entries.length,
      i = 1,
      input  = entries[0],
      values = entries[n-1],
      output = entries[n-2];

  // add operator entries to this scope, wire up pulse chain
  scope.add(entries[0]);
  for (; i<n; ++i) {
    entries[i].params.pulse = ref(entries[i-1]);
    scope.add(entries[i]);
  }

  return new DataScope(scope, input, output, values);
};

var prototype$70 = DataScope.prototype;

prototype$70.countsRef = function(scope, field, sort) {
  var ds = this,
      cache = ds.counts || (ds.counts = {}),
      k = fieldKey(field), v, a, p;

  if (k != null) {
    scope = ds.scope;
    v = cache[k];
  }

  if (!v) {
    p = {
      groupby: scope.fieldRef(field, 'key'),
      pulse: ref(ds.output)
    };
    if (sort && sort.field) addSortField(scope, p, sort);
    a = scope.add(Aggregate$1(p));
    v = scope.add(Collect$1({pulse: ref(a)}));
    v = {agg: a, ref: ref(v)};
    if (k != null) cache[k] = v;
  } else if (sort && sort.field) {
    addSortField(scope, v.agg.params, sort);
  }

  return v.ref;
};

function fieldKey(field) {
  return isString(field) ? field : null;
}

function addSortField(scope, p, sort) {
  var as = aggrField(sort.op, sort.field), s;

  if (p.ops) {
    for (var i=0, n=p.as.length; i<n; ++i) {
      if (p.as[i] === as) return;
    }
  } else {
    p.ops = ['count'];
    p.fields = [null];
    p.as = ['count'];
  }
  if (sort.op) {
    p.ops.push((s=sort.op.signal) ? scope.signalRef(s) : sort.op);
    p.fields.push(scope.fieldRef(sort.field));
    p.as.push(as);
  }
}

function cache$3(scope, ds, name, optype, field, counts, index) {
  var cache = ds[name] || (ds[name] = {}),
      sort = sortKey(counts),
      k = fieldKey(field), v, op;

  if (k != null) {
    scope = ds.scope;
    k = k + (sort ? '|' + sort : '');
    v = cache[k];
  }

  if (!v) {
    var params = counts
      ? {field: keyFieldRef, pulse: ds.countsRef(scope, field, counts)}
      : {field: scope.fieldRef(field), pulse: ref(ds.output)};
    if (sort) params.sort = scope.sortRef(counts);
    op = scope.add(entry$1(optype, undefined, params));
    if (index) ds.index[field] = op;
    v = ref(op);
    if (k != null) cache[k] = v;
  }
  return v;
}

prototype$70.tuplesRef = function() {
  return ref(this.values);
};

prototype$70.extentRef = function(scope, field) {
  return cache$3(scope, this, 'extent', 'Extent', field, false);
};

prototype$70.domainRef = function(scope, field) {
  return cache$3(scope, this, 'domain', 'Values', field, false);
};

prototype$70.valuesRef = function(scope, field, sort) {
  return cache$3(scope, this, 'vals', 'Values', field, sort || true);
};

prototype$70.lookupRef = function(scope, field) {
  return cache$3(scope, this, 'lookup', 'TupleIndex', field, false);
};

prototype$70.indataRef = function(scope, field) {
  return cache$3(scope, this, 'indata', 'TupleIndex', field, true, true);
};

function parseFacet(spec, scope, group) {
  var facet = spec.from.facet,
      name = facet.name,
      data = ref(scope.getData(facet.data).output),
      subscope, source, values, op;

  if (!facet.name) {
    error('Facet must have a name: ' + JSON.stringify(facet));
  }
  if (!facet.data) {
    error('Facet must reference a data set: ' + JSON.stringify(facet));
  }

  if (facet.field) {
    op = scope.add(PreFacet$1({
      field: scope.fieldRef(facet.field),
      pulse: data
    }));
  } else if (facet.groupby) {
    op = scope.add(Facet$1({
      key:   scope.keyRef(facet.groupby),
      group: group.pulse,
      pulse: data
    }));
  } else {
    error('Facet must specify groupby or field: ' + JSON.stringify(facet));
  }

  // initialize facet subscope
  subscope = scope.fork();
  source = subscope.add(Collect$1());
  values = subscope.add(Sieve$1({pulse: ref(source)}));
  subscope.addData(name, new DataScope(subscope, source, source, values));
  subscope.addSignal('parent', null);

  // parse faceted subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}

function parseSubflow(spec, scope, input) {
  var op = scope.add(PreFacet$1({pulse: input.pulse})),
      subscope = scope.fork();

  subscope.add(Sieve$1());
  subscope.addSignal('parent', null);

  // parse group mark subflow
  op.params.subflow = {
    $subflow: parseSpec(spec, subscope).toRuntime()
  };
}

function parseTrigger(spec, scope, name) {
  var remove = spec.remove,
      insert = spec.insert,
      toggle = spec.toggle,
      modify = spec.modify,
      values = spec.values,
      op = scope.add(operator()),
      update, expr;

  update = 'if(' + spec.trigger + ',modify("'
    + name + '",'
    + [insert, remove, toggle, modify, values]
        .map(function(_) { return _ == null ? 'null' : _; })
        .join(',')
    + '),0)';

  expr = parseExpression(update, scope);
  op.update = expr.$expr;
  op.params = expr.$params;
}

function parseMark(spec, scope) {
  var role$$ = role(spec),
      group = spec.type === GroupMark,
      facet = spec.from && spec.from.facet,
      layout = role$$ === ScopeRole$1 || role$$ === FrameRole$1,
      op, input, store, bound, render, sieve, name,
      markRef, encodeRef, boundRef;

  // resolve input data
  input = parseData(spec.from, group, scope);

  // data join to map tuples to visual items
  op = scope.add(DataJoin$1(input));

  // collect visual items
  op = store = scope.add(Collect$1({pulse: ref(op)}));

  // connect visual items to scenegraph
  op = scope.add(Mark$1({
    markdef:   definition$1(spec),
    scenepath: {$itempath: scope.markpath()},
    pulse:     ref(op)
  }));
  markRef = ref(op);

  // add visual encoders
  op = scope.add(Encode$1(
    encoders(spec.encode, spec.type, role$$, scope, {pulse: markRef})
  ));

  // add post-encoding transforms, if defined
  if (spec.transform) {
    spec.transform.forEach(function(_) {
      var tx = parseTransform(_, scope);
      if (tx.metadata.generates || tx.metadata.changes) {
        error('Mark transforms should not generate new data.');
      }
      tx.params.pulse = ref(op);
      scope.add(op = tx);
    });
  }

  // monitor parent marks to propagate changes
  op.params.parent = scope.encode();
  encodeRef = ref(op);

  // if group is faceted or requires view layout, recurse here
  if (facet || layout) {
    op = scope.add(ViewLayout$1({
      legendMargin: scope.config.legendMargin,
      mark:         markRef,
      pulse:        encodeRef
    }));

    // we juggle the layout operator as we want it in our scope state,
    // but we also want it to be run *after* any faceting transforms
    scope.operators.pop();
    scope.pushState(encodeRef, ref(op));
    (facet ? parseFacet(spec, scope, input) : parseSubflow(spec, scope, input));
    scope.popState();
    scope.operators.push(op);
  }

  // compute bounding boxes
  bound = scope.add(Bound$1({mark: markRef, pulse: ref(op)}));
  boundRef = ref(bound);

  // if non-faceted / non-layout group, recurse here
  if (group && !facet && !layout) {
    scope.pushState(encodeRef, boundRef);
    // if a normal group mark, we must generate dynamic subflows
    // otherwise, we know the group is a guide with only one group item
    // in that case we can simplify the dataflow
    (role$$ === MarkRole ? parseSubflow(spec, scope, input) : parseSpec(spec, scope));
    scope.popState();
  }

  // render / sieve items
  render = scope.add(Render$1({pulse: boundRef}));
  sieve = scope.add(Sieve$1({pulse: boundRef}, undefined, scope.parent()));

  // if mark is named, make accessible as reactive geometry
  // add trigger updates if defined
  if (spec.name != null) {
    name = dataName(spec.name);
    scope.addData(name, new DataScope(scope, store, render, sieve));
    if (spec.on) spec.on.forEach(function(on) {
      if (on.insert || on.remove || on.toggle) {
        error('Marks only support modify triggers.');
      }
      parseTrigger(on, scope, name);
    });
  }
}

function parseLegend(spec, scope) {
  var type = spec.type || 'symbol',
      config = scope.config.legend,
      encode = spec.encode || {},
      interactive = !!spec.interactive,
      datum, dataRef, entryRef, group, title,
      legendEncode, entryEncode, children;

  // resolve 'canonical' scale name
  var scale = spec.size || spec.shape || spec.fill || spec.stroke || spec.opacity;

  if (!scale) {
    error('Missing valid scale for legend.');
  }

  // single-element data source for axis group
  datum = {
    orient: value(spec.orient, config.orient),
    title:  spec.title
  };
  dataRef = ref(scope.add(Collect$1(null, [datum])));

  // encoding properties for legend group
  legendEncode = extendEncode({
    update: {
      offset:        encoder(value(spec.offset, config.offset)),
      padding:       encoder(value(spec.padding, config.padding)),
      titlePadding:  encoder(value(spec.titlePadding, config.titlePadding))
    }
  }, encode.legend);

  // encoding properties for legend entry sub-group
  entryEncode = {
    update: {
      x: {field: {group: 'padding'}},
      y: {field: {group: 'padding'}},
      entryPadding: encoder(value(spec.entryPadding, config.entryPadding))
    }
  };

  if (type === 'gradient') {
    // data source for gradient labels
    entryRef = ref(scope.add(LegendEntries$1({
      type:   'gradient',
      scale:  scope.scaleRef(scale),
      count:  scope.property(spec.count),
      values: scope.property(spec.values),
      formatSpecifier: scope.property(spec.format)
    })));

    children = [
      legendGradient(scale, config, encode.gradient),
      legendGradientLabels(spec, config, encode.labels, entryRef)
    ];
  }

  else {
    // data source for legend entries
    entryRef = ref(scope.add(LegendEntries$1({
      size:   sizeExpression(spec, config, encode.labels),
      scale:  scope.scaleRef(scale),
      count:  scope.property(spec.count),
      values: scope.property(spec.values),
      formatSpecifier: scope.property(spec.formatSpecifier)
    })));

    children = [
      legendSymbols(spec, config, encode.symbols, entryRef),
      legendLabels(spec, config, encode.labels, entryRef)
    ];
  }

  // generate legend marks
  children = [
    guideGroup(LegendEntryRole, dataRef, interactive, entryEncode, children)
  ];

  // include legend title if defined
  if (datum.title) {
    title = legendTitle(spec, config, encode.title, dataRef);
    entryEncode.update.y.offset = {
      field: {group: 'titlePadding'},
      offset: title.encode.update.fontSize || title.encode.enter.fontSize
    };
    children.push(title);
  }

  // build legend specification
  group = guideGroup(LegendRole$1, dataRef, interactive, legendEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse legend specification
  return parseMark(group, scope);
}

function value(value, defaultValue) {
  return value != null ? value : defaultValue;
}

function sizeExpression(spec, config, encode) {
  // TODO get override for symbolSize...
  var symbolSize = +config.symbolSize, fontSize;
  fontSize = encode && encode.update && encode.update.fontSize;
  if (!fontSize) fontSize = encode && encode.enter && encode.enter.fontSize;
  if (fontSize) fontSize = fontSize.value; // TODO support signal?
  if (!fontSize) fontSize = +config.labelFontSize;

  return spec.size
    ? {$expr: 'Math.max(ceil(sqrt(_.scale(datum))),' + fontSize + ')'}
    : Math.max(Math.ceil(Math.sqrt(symbolSize)), fontSize);
}

var types = [
  'identity',
  'ordinal', 'band', 'point', 'index',
  'linear', 'pow', 'sqrt', 'log', 'sequential',
  'time', 'utc',
  'quantize', 'quantile', 'threshold'
]

var allTypes = toSet(types);
var ordinalTypes = toSet(types.slice(1, 5));
function isOrdinal(type) {
  return ordinalTypes.hasOwnProperty(type);
}

function isQuantile(type) {
  return type === 'quantile';
}

function parseScale(spec, scope) {
  var type = spec.type || 'linear',
      params, key;

  if (!allTypes.hasOwnProperty(type)) {
    error('Unrecognized scale type: ' + type);
  }

  params = {
    type:   type,
    domain: parseScaleDomain(spec.domain, spec, scope)
  };

  if (spec.range != null) {
    if (spec.bandSize != null) {
      error('Scale range and bandSize are mutually exclusive.');
    }
    params.range = parseScaleRange(spec, scope);
  }

  for (key in spec) {
    if (params[key] || key === 'name') continue;
    params[key] = parseLiteral(spec[key], scope);
  }

  scope.addScale(spec.name, params);
}

function parseLiteral(v, scope) {
  return !isObject(v) ? v
    : v.signal ? scope.signalRef(v.signal)
    : error('Unsupported object: ' + v);
}

// -- SCALE DOMAIN ----

function parseScaleDomain(domain, spec, scope) {
  if (!domain) return; // default domain

  if (domain.signal) {
    return scope.signalRef(domain.signal);
  }

  return (isArray(domain) ? explicitDomain
    : domain.fields ? multipleDomain
    : singularDomain)(domain, spec, scope);
}

function explicitDomain(domain, spec, scope) {
  return domain.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function singularDomain(domain, spec, scope) {
  var data = scope.getData(domain.data);
  if (!data) error('Can not find data set: ' + domain.data);

  return isOrdinal(spec.type)
      ? data.valuesRef(scope, domain.field, parseSort(domain.sort, false))
      : isQuantile(spec.type) ? data.domainRef(scope, domain.field)
      : data.extentRef(scope, domain.field);
}

function multipleDomain(domain, spec, scope) {
  var data = domain.data,
      fields = domain.fields.reduce(function(dom, d) {
        return dom.push(isString(d) ? {data: data, field: d} : d), dom;
      }, []);

  return (isOrdinal(spec.type) ? ordinalMultipleDomain
    : isQuantile(spec.type) ? quantileMultipleDomain
    : numericMultipleDomain)(domain, scope, fields);
}

function ordinalMultipleDomain(domain, scope, fields) {
  var counts, a, c, v;

  // get value counts for each domain field
  counts = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.countsRef(scope, f.field);
  });

  // sum counts from all fields
  a = scope.add(Aggregate$1({
    groupby: keyFieldRef,
    ops:['sum'], fields: [scope.fieldRef('count')], as:['count'],
    pulse: counts
  }));

  // collect aggregate output
  c = scope.add(Collect$1({pulse: ref(a)}));

  // extract values for combined domain
  v = scope.add(Values$1({
    field: keyFieldRef,
    sort:  scope.sortRef(parseSort(domain.sort, true)),
    pulse: ref(c)
  }));

  return ref(v);
}

function parseSort(sort, multidomain) {
  if (sort) {
    if (!sort.field && !sort.op) {
      if (isObject(sort)) sort.field = 'key';
      else sort = {field: 'key'};
    } else if (!sort.field && sort.op !== 'count') {
      error('No field provided for sort aggregate op: ' + sort.op);
    } else if (multidomain && sort.field) {
      error('Multiple domain scales can not sort by field.');
    } else if (multidomain && sort.op && sort.op !== 'count') {
      error('Multiple domain scales support op count only.');
    }
  }
  return sort;
}

function quantileMultipleDomain(domain, scope, fields) {
  // get value arrays for each domain field
  var values = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.domainRef(scope, f.field);
  });

  // combine value arrays
  return ref(scope.add(MultiValues$1({values: values})));
}

function numericMultipleDomain(domain, scope, fields) {
  // get extents for each domain field
  var extents = fields.map(function(f) {
    var data = scope.getData(f.data);
    if (!data) error('Can not find data set: ' + f.data);
    return data.extentRef(scope, f.field);
  });

  // combine extents
  return ref(scope.add(MultiExtent$1({extents: extents})));
}

// -- SCALE RANGE -----

function parseScaleRange(spec, scope) {
  var range = spec.range,
      config = scope.config.range;

  if (range.signal) {
    return scope.signalRef(range.signal);
  } else if (isString(range)) {
    if (config && config.hasOwnProperty(range)) {
      range = config[range];
    } else if (range === 'width') {
      range = [0, {signal: 'width'}]
    } else if (range === 'height') {
      range = isOrdinal(spec.type)
        ? [0, {signal: 'height'}]
        : [{signal: 'height'}, 0]
    } else {
      error('Unrecognized scale range value: ' + range);
    }
  } else if (isOrdinal(spec.type) && !isArray(range)) {
    return parseScaleDomain(range, spec, scope);
  } else if (!isArray(range)) {
    error('Unsupported range type: ' + range);
  }

  return range.map(function(v) {
    return parseLiteral(v, scope);
  });
}

function parseData$1(data, scope) {
  var transforms = [];

  if (data.transform) {
    data.transform.forEach(function(tx) {
      transforms.push(parseTransform(tx, scope));
    });
  }

  if (data.on) {
    data.on.forEach(function(on) {
      parseTrigger(on, scope, data.name);
    });
  }

  scope.addDataPipeline(data.name, analyze(data, scope, transforms));
}

/**
 * Analyze a data pipeline, add needed operators.
 */
function analyze(data, scope, ops) {
  // POSSIBLE TODOs:
  // - error checking for treesource on tree operators (BUT what if tree is upstream?)
  // - this is local analysis, perhaps some tasks better for global analysis...

  var output = [],
      source = null,
      modify = false,
      generate = false,
      upstream, i, n, t, m;

  if (data.values) {
    // hard-wired input data set
    output.push(source = collect({$ingest: data.values, $format: data.format}));
  } else if (data.url) {
    // load data from external source
    output.push(source = collect({$request: data.url, $format: data.format}));
  } else if (data.source) {
    // derives from another data set
    upstream = scope.getData(data.source);
    source = upstream.output;
    output.push(null); // populate later
  }

  // scan data transforms, add collectors as needed
  for (i=0, n=ops.length; i<n; ++i) {
    t = ops[i];
    m = t.metadata;

    if (!source && !m.source) {
      output.push(source = collect());
    }
    output.push(t);

    if (m.generates) generate = true;
    if (m.modifies && !generate) modify = true;

    if (m.source) source = t;
    else if (m.changes) source = null;
  }

  if (upstream) {
    output[0] = Relay$1({derive: modify, pulse: ref(upstream.output)});
    if (modify) output.splice(1, 0, collect()); // collect derived tuples
  }

  if (!source) output.push(collect());
  output.push(Sieve$1({}));
  return output;
}

function collect(values) {
  var s = Collect$1({}, values);
  return s.metadata = {source: true}, s;
}

function axisConfig(spec, scope) {
  var config = scope.config,
      orient = spec.orient,
      xy = (orient === Top || orient === Bottom) ? config.axisX : config.axisY,
      or = config['axis' + orient[0].toUpperCase() + orient.slice(1)],
      band = scope.scaleType(spec.scale) === 'band' && config.axisBand;

  return (xy || or || band)
    ? extend({}, config.axis, xy, or, band)
    : config.axis;
}

function axisDomain(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      zero = {value: 0},
      encode = {}, enter, update;

  encode.enter = enter = {
    opacity: zero,
    stroke: {value: config.tickColor},
    strokeWidth: {value: config.tickWidth}
  };

  encode.exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  if (orient === Top || orient === Bottom) {
    enter.y = zero;
    update.x = enter.x = position(spec, 0);
    update.x2 = enter.x2 = position(spec, 1);
  } else {
    enter.x = zero;
    update.y = enter.y = position(spec, 0);
    update.y2 = enter.y2 = position(spec, 1);
  }

  return guideMark(RuleMark, AxisDomainRole, null, dataRef, encode, userEncode);
}

function position(spec, pos) {
  return {scale: spec.scale, range: pos};
}

function axisGrid(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? 1 : -1,
      offset = sign * spec.offset || 0,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickPos;

  encode.enter = enter = {
    opacity: zero,
    stroke: {value: config.gridColor},
    strokeWidth: {value: config.gridWidth},
    strokeDash: {value: config.gridDash}
  };

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: config.gridOpacity}
  };

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra
  };

  if (orient === Top || orient === Bottom) {
    enter.y = {value: offset};
    update.y2 = enter.y2 = {signal: 'height', mult: sign, offset: offset};
    update.x = enter.x = exit.x = tickPos;
  } else {
    enter.x = {value: offset};
    update.x2 = enter.x2 = {signal: 'width', mult: sign, offset: offset};
    update.y = enter.y = exit.y = tickPos;
  }

  return guideMark(RuleMark, AxisGridRole, Value, dataRef, encode, userEncode);
}

function axisTicks(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      size = spec.tickSize != null ? spec.tickSize : config.tickSize,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero,
    stroke: {value: config.tickColor},
    strokeWidth: {value: config.tickWidth}
  };

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;

  tickPos = {
    scale:  spec.scale,
    field:  Value,
    band:   config.bandPosition,
    round:  config.tickRound,
    extra:  config.tickExtra
  };

  if (orient === Top || orient === Bottom) {
    update.y = enter.y = zero;
    update.y2 = enter.y2 = tickSize;
    update.x = enter.x = exit.x = tickPos;
  } else {
    update.x = enter.x = zero;
    update.x2 = enter.x2 = tickSize;
    update.y = enter.y = exit.y = tickPos;
  }

  return guideMark(RuleMark, AxisTickRole, Label, dataRef, encode, userEncode);
}

function axisLabels(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      size = spec.tickSize != null ? spec.tickSize : config.tickSize,
      pad = spec.tickPadding != null ? spec.tickPadding : config.tickPadding,
      zero = {value: 0},
      encode = {}, enter, exit, update, tickSize, tickPos;

  encode.enter = enter = {
    opacity: zero,
    fill: {value: config.tickLabelColor},
    font: {value: config.tickLabelFont},
    fontSize: {value: config.tickLabelFontSize},
    text: {field: Label}
  };

  encode.exit = exit = {
    opacity: zero
  };

  encode.update = update = {
    opacity: {value: 1}
  };

  tickSize = encoder(size);
  tickSize.mult = sign;
  tickSize.offset = encoder(pad);
  tickSize.offset.mult = sign;

  tickPos = {
    scale: spec.scale,
    field: Value,
    band: 0.5
  };

  if (orient === Top || orient === Bottom) {
    update.y = enter.y = tickSize;
    update.x = enter.x = exit.x = tickPos;
    update.align = {value: 'center'};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.x = enter.x = tickSize;
    update.y = enter.y = exit.y = tickPos;
    update.align = {value: orient === Right ? 'left' : 'right'};
    update.baseline = {value: 'middle'};
  }

  return guideMark(TextMark, AxisLabelRole, Label, dataRef, encode, userEncode);
}

function axisTitle(spec, config, userEncode, dataRef) {
  var orient = spec.orient,
      sign = (orient === Left || orient === Top) ? -1 : 1,
      horizontal = (orient === Top || orient === Bottom),
      encode = {}, update, titlePos;

  encode.enter = {
    opacity: {value: 0},
    fill: {value: config.titleColor},
    font: {value: config.titleFont},
    fontSize: {value: config.titleFontSize},
    fontWeight: {value: config.titleFontWeight},
    align: {value: config.titleAlign}
  };

  encode.exit = {
    opacity: {value: 0}
  };

  encode.update = update = {
    opacity: {value: 1},
    text: {field: 'title'}
  };

  titlePos = {
    scale: spec.scale,
    range: 0.5
  };

  if (horizontal) {
    update.x = titlePos;
    update.angle = {value: 0};
    update.baseline = {value: orient === Top ? 'bottom' : 'top'};
  } else {
    update.y = titlePos;
    update.angle = {value: sign * 90};
    update.baseline = {value: 'bottom'};
  }

  if (config.titleAngle != null) {
    update.angle = {value: config.titleAngle};
  }

  if (config.titleBaseline != null) {
    update.baseline = {value: config.titleBaseline};
  }

  if (config.titleX != null) {
    update.x = {value: config.titleX};
  } else if (horizontal && !has(userEncode, 'x')) {
    encode.enter.auto = {value: true}
  }

  if (config.titleY != null) {
    update.y = {value: config.titleY};
  } else if (!horizontal && !has(userEncode, 'y')) {
    encode.enter.auto = {value: true}
  }

  return guideMark(TextMark, AxisTitleRole, null, dataRef, encode, userEncode);
}

function parseAxis(spec, scope) {
  var config = axisConfig(spec, scope),
      encode = spec.encode || {},
      interactive = !!spec.interactive,
      datum, dataRef, ticksRef, group, axisEncode, children;

  // single-element data source for axis group
  datum = {
    orient: spec.orient,
    domain: spec.domain != null ? !!spec.domain : config.domainDefault,
    grid:   spec.grid != null ? !!spec.grid : config.gridDefault,
    title:  spec.title
  };
  dataRef = ref(scope.add(Collect$1({}, [datum])));

  // encoding properties for axis group item
  axisEncode = extendEncode({
    update: {
      range:        {expr: 'abs(span(range("' + spec.scale + '")))'},
      offset:       encoder(spec.offset || 0),
      position:     encoder(spec.position || 0),
      titlePadding: encoder(spec.titlePadding || config.titlePadding),
      minExtent:    encoder(spec.minExtent || config.minExtent),
      maxExtent:    encoder(spec.maxExtent || config.maxExtent)
    }
  }, encode.axis);

  // data source for axis ticks
  ticksRef = ref(scope.add(AxisTicks$1({
    scale:  scope.scaleRef(spec.scale),
    extra:  config.tickExtra,
    count:  scope.property(spec.count),
    values: scope.property(spec.values),
    formatSpecifier: scope.property(spec.format)
  })));

  // generate axis marks
  children = [
    axisTicks(spec, config, encode.ticks, ticksRef),
    axisLabels(spec, config, encode.labels, ticksRef)
  ];

  // include axis gridlines if requested
  if (datum.grid) {
    children.unshift(axisGrid(spec, config, encode.grid, ticksRef));
  }

  // include axis domain path if requested
  if (datum.domain) {
    children.push(axisDomain(spec, config, encode.domain, dataRef));
  }

  // include axis title if defined
  if (datum.title) {
    children.push(axisTitle(spec, config, encode.title, dataRef));
  }

  // build axis specification
  group = guideGroup(AxisRole$1, dataRef, interactive, axisEncode, children);
  if (spec.zindex) group.zindex = spec.zindex;

  // parse axis specification
  return parseMark(group, scope);
}

function parseSpec(spec, scope, preprocessed) {
  var signals = array$1(spec.signals);

  if (!preprocessed) signals.forEach(function(_) {
    parseSignal(_, scope);
  });

  array$1(spec.projections).forEach(function(_) {
    parseProjection(_, scope);
  });

  array$1(spec.data).forEach(function(_) {
    parseData$1(_, scope);
  });

  array$1(spec.scales).forEach(function(_) {
    parseScale(_, scope);
  });

  signals.forEach(function(_) {
    parseSignalUpdates(_, scope);
  });
  scope.parseLambdas();

  array$1(spec.axes).forEach(function(_) {
    parseAxis(_, scope);
  });

  array$1(spec.marks).forEach(function(_) {
    parseMark(_, scope);
  });

  array$1(spec.legends).forEach(function(_) {
    parseLegend(_, scope);
  });

  return scope;
}

var defined = toSet(['width', 'height', 'padding']);

function parseView(spec, scope) {
  var op, input, encode, parent, root;

  scope.background = spec.background || scope.config.background;
  root = ref(scope.root = scope.add(operator()));
  scope.addSignal('width', spec.width || -1);
  scope.addSignal('height', spec.height || -1);
  scope.addSignal('padding', parsePadding(spec.padding));

  array$1(spec.signals).forEach(function(_) {
    if (!defined[_.name]) parseSignal(_, scope);
  });

  // Store root group item
  input = scope.add(Collect$1());

  // Encode root group item
  encode = extendEncode({
    enter: { x: {value: 0}, y: {value: 0} },
    update: { width: {signal: 'width'}, height: {signal: 'height'} }
  }, spec.encode);

  encode = scope.add(Encode$1(
    encoders(encode, GroupMark, FrameRole$1, scope, {pulse: ref(input)}))
  );

  // Perform view layout
  parent = scope.add(ViewLayout$1({
    legendMargin: scope.config.legendMargin,
    autosize:     spec.autosize || scope.config.autosize,
    mark:         root,
    pulse:        ref(encode)
  }));

  // Parse remainder of specification
  scope.pushState(ref(encode), ref(parent));
  parseSpec(spec, scope, true);

  // Bound / render / sieve root item
  op = scope.add(Bound$1({mark: root, pulse: ref(parent)}));
  op = scope.add(Render$1({pulse: ref(op)}));
  op = scope.add(Sieve$1({pulse: ref(op)}));

  // Track metadata for root item
  scope.addData('root', new DataScope(scope, input, input, op));

  return scope;
}

function Scope(config) {
  this.config = config;

  this.bindings = [];
  this.field = {};
  this.signals = {};
  this.lambdas = {};
  this.scales = {};
  this.events = {};
  this.data = {};

  this.streams = [];
  this.updates = [];
  this.operators = [];
  this.background = null;

  this._id = 0;
  this._subid = 0;
  this._nextsub = [0];

  this._parent = [];
  this._encode = [];
  this._markpath = [];
}

function Subscope(scope) {
  this.config = scope.config;

  this.field = Object.create(scope.field);
  this.signals = Object.create(scope.signals);
  this.lambdas = Object.create(scope.lambdas);
  this.scales = Object.create(scope.scales);
  this.events = Object.create(scope.events);
  this.data = Object.create(scope.data);

  this.streams = [];
  this.updates = [];
  this.operators = [];

  this._id = 0;
  this._subid = ++scope._nextsub[0];
  this._nextsub = scope._nextsub;

  this._parent = scope._parent.slice();
  this._encode = scope._encode.slice();
  this._markpath = scope._markpath;
}

var prototype$71 = Scope.prototype = Subscope.prototype;

// ----

prototype$71.fork = function() {
  return new Subscope(this);
};

prototype$71.toRuntime = function() {
  return this.finish(), {
    background: this.background,
    operators:  this.operators,
    streams:    this.streams,
    updates:    this.updates,
    bindings:   this.bindings
  };
};

prototype$71.id = function() {
  return (this._subid ? this._subid + ':' : 0) + this._id++;
};

prototype$71.add = function(op) {
  return this.operators.push(op), op.id = this.id(), op;
};

prototype$71.addStream = function(stream) {
  return this.streams.push(stream), stream.id = this.id(), stream;
};

prototype$71.addUpdate = function(update) {
  return this.updates.push(update), update;
};

// Apply metadata
prototype$71.finish = function() {
  var name, ds;

  // annotate root
  if (this.root) this.root.root = true;

  // annotate signals
  for (name in this.signals) {
    this.signals[name].signal = name;
  }

  // annotate scales
  for (name in this.scales) {
    this.scales[name].scale = name;
  }

  // annotate data sets
  function annotate(op, name, type) {
    var data, list;
    if (op) {
      data = op.data || (op.data = {});
      list = data[name] || (data[name] = []);
      list.push(type);
    }
  }
  for (name in this.data) {
    ds = this.data[name];
    annotate(ds.input,  name, 'input');
    annotate(ds.output, name, 'output');
    annotate(ds.values, name, 'values');
    for (var field in ds.index) {
      annotate(ds.index[field], name, 'index:' + field);
    }
  }

  return this;
};

// ----

prototype$71.pushState = function(encode, parent) {
  this._encode.push(ref(this.add(Sieve$1({pulse: encode}))));
  this._parent.push(parent);
  this._markpath.push(-1);
};

prototype$71.popState = function() {
  this._parent.pop();
  this._encode.pop();
  this._markpath.pop();
};

prototype$71.parent = function() {
  return peek(this._parent);
};

prototype$71.encode = function() {
  return peek(this._encode);
};

prototype$71.markpath = function() {
  var p = this._markpath;
  return ++p[p.length-1], p.slice();
};

// ----

prototype$71.fieldRef = function(field, name) {
  if (isString(field)) return fieldRef(field, name);
  if (!field.signal) {
    error('Unsupported field reference: ' + JSON.stringify(field));
  }

  var s = field.signal,
      f = this.field[s],
      params;

  if (!f) { // TODO: replace with update signalRef?
    params = {name: this.signalRef(s)}
    if (name) params.as = name;
    this.field[s] = f = ref(this.add(Field$1(params)));
  }
  return f;
};

prototype$71.compareRef = function(cmp) {
  function check(_) {
    return isSignal(_) ? (signal = true, ref(sig[_.signal])) : _;
  }

  var sig = this.signals,
      signal = false,
      fields = array$1(cmp.field).map(check),
      orders = array$1(cmp.order).map(check);

  return signal
    ? ref(this.add(Compare$1({fields: fields, orders: orders})))
    : compareRef(fields, orders);
};

prototype$71.keyRef = function(fields) {
  function check(_) {
    return isSignal(_) ? (signal = true, ref(sig[_.signal])) : _;
  }

  var sig = this.signals,
      signal = false;
  fields = array$1(fields).map(check);

  return signal
    ? ref(this.add(Key$1({fields: fields})))
    : keyRef(fields);
};

prototype$71.sortRef = function(sort) {
  if (!sort) return sort;

  // including id ensures stable sorting
  // TODO review? enable multi-field sorts?
  var a = [aggrField(sort.op, sort.field), '_id'],
      o = sort.order || Ascending;

  return o.signal
    ? ref(this.add(Compare$1({
        fields: a,
        orders: [o = this.signalRef(o.signal), o]
      })))
    : compareRef(a, [o, o]);
};

// ----

prototype$71.event = function(source, type) {
  var key = source + ':' + type;
  if (!this.events[key]) {
    var id = this.id();
    this.streams.push({
      id: id,
      source: source,
      type: type
    });
    this.events[key] = id;
  }
  return this.events[key];
};

// ----

prototype$71.addSignal = function(name, value) {
  if (this.signals.hasOwnProperty(name)) {
    error('Duplicate signal name: ' + name);
  }
  var op = value instanceof Entry ? value : this.add(operator(value));
  return this.signals[name] = op;
};

prototype$71.getSignal = function(name) {
  if (!this.signals[name]) {
    error('Unrecognized signal name: ' + name);
  }
  return this.signals[name];
};

prototype$71.signalRef = function(s) {
  if (this.signals[s]) {
    return ref(this.signals[s]);
  } else if (!this.lambdas[s]) {
    this.lambdas[s] = this.add(operator(null));
  }
  return ref(this.lambdas[s]);
};

prototype$71.parseLambdas = function() {
  var code = Object.keys(this.lambdas);
  for (var i=0, n=code.length; i<n; ++i) {
    var s = code[i],
        e = parseExpression(s, this),
        op = this.lambdas[s];
    op.params = e.$params;
    op.update = e.$expr;
  }
};

prototype$71.property = function(spec) {
  return spec && spec.signal ? this.signalRef(spec.signal) : spec;
};

prototype$71.addBinding = function(name, bind) {
  if (!this.bindings) error('Nested signals do not support binding.');
  this.bindings.push(extend({signal: name}, bind));
};

// ----

prototype$71.addScaleProj = function(name, transform) {
  if (this.scales.hasOwnProperty(name)) {
    error('Duplicate scale or projection name: ' + name);
  }
  this.scales[name] = this.add(transform);
}

prototype$71.addScale = function(name, params) {
  this.addScaleProj(name, Scale$1(params));
};

prototype$71.addProjection = function(name, params) {
  this.addScaleProj(name, Projection$1(params));
};

prototype$71.getScale = function(name) {
  if (!this.scales[name]) {
    error('Unrecognized scale name: ' + name);
  }
  return this.scales[name];
};

prototype$71.projectionRef =
prototype$71.scaleRef = function(name) {
  return ref(this.getScale(name));
};

prototype$71.projectionType =
prototype$71.scaleType = function(name) {
  return this.getScale(name).params.type;
};

// ----

prototype$71.addData = function(name, dataScope) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + name);
  }
  this.data[name] = dataScope;
};

prototype$71.getData = function(name) {
  if (!this.data[name]) {
    error('Undefined data set name: ' + name);
  }
  return this.data[name];
};

prototype$71.addDataPipeline = function(name, entries) {
  if (this.data.hasOwnProperty(name)) {
    error('Duplicate data set name: ' + name);
  }
  this.addData(name, DataScope.fromEntries(this, entries));
};

function defaults(userConfig) {
  var config = defaults$1(), key;
  for (key in userConfig) {
    config[key] = isObject(config[key])
      ? extend(config[key], userConfig[key])
      : config[key] = userConfig[key];
  }
  return config;
}

/**
 * Standard configuration defaults for Vega specification parsing.
 * Users can provide their own (sub-)set of these default values
 * by passing in a config object to the top-level parse method.
 */
function defaults$1() {
  return {
    // default for automatic sizing; options: none, pad, fit
    autosize: 'pad',

    // default view background color
    // covers the entire view component
    background: null,

    // defaults for top-level group marks
    // accepts mark properties (fill, stroke, etc)
    // covers the data rectangle within group width/height
    group: null,

    // defaults for basic mark types
    // each subset accepts mark properties (fill, stroke, etc)
    mark: {
      arc: { fill: 'steelblue' },
      area: { fill: 'steelblue' },
      image: null,
      line: { stroke: 'steelblue' },
      path: { stroke: 'steelblue' },
      rect: { fill: 'steelblue' },
      rule: { stroke: '#000' },
      shape: { stroke: 'steelblue' },
      symbol: {
        fill: 'steelblue',
        size: 64
      },
      text: {
        fill: '#000',
        font: 'sans-serif',
        fontSize: 11
      }
    },

    // defaults for axes
    axis: {
      minExtent: 0,
      maxExtent: 200,
      bandPosition: 0.5,
      domainDefault: true,
      domainWidth: 1,
      domainColor: '#000',
      gridDefault: false,
      gridWidth: 1,
      gridColor: '#ddd',
      gridDash: [],
      gridOpacity: 1,
      tickPadding: 2,
      tickRound: true,
      tickSize: 5,
      tickWidth: 1,
      tickColor: '#000',
      tickLabelColor: '#000',
      tickLabelFont: 'sans-serif',
      tickLabelFontSize: 10,
      titleAlign: 'center',
      titlePadding: 2,
      titleColor: '#000',
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold'
    },

    // defaults for legends
    legend: {
      orient: 'right',
      offset: 18,
      padding: 0,
      entryPadding: 5,
      titlePadding: 5,
      gradientWidth: 100,
      gradientHeight: 20,
      gradientStrokeColor: '#ddd',
      gradientStrokeWidth: 0,
      gradientLabelBaseline: 'top',
      gradientLabelOffset: 2,
      labelColor: '#000',
      labelFontSize: 10,
      labelFont: 'sans-serif',
      labelAlign: 'left',
      labelBaseline: 'middle',
      labelOffset: 8,
      symbolType: 'circle',
      symbolSize: 100,
      symbolColor: '#888',
      symbolStrokeWidth: 1.5,
      titleColor: '#000',
      titleFont: 'sans-serif',
      titleFontSize: 11,
      titleFontWeight: 'bold',
      titleAlign: 'left',
      titleBaseline: 'top'
    },

    // defaults for scale ranges
    range: {
      category: [
        '#1f77b4',
        '#ff7f0e',
        '#2ca02c',
        '#d62728',
        '#9467bd',
        '#8c564b',
        '#e377c2',
        '#7f7f7f',
        '#bcbd22',
        '#17becf'
      ],
      symbol: [
        'circle',
        'square',
        'triangle-up',
        'cross',
        'diamond',
        'triangle-right',
        'triangle-down',
        'triangle-left'
      ]
    }
  };
}

function parse$3(spec, config) {
  return parseView(spec, new Scope(defaults(config || spec.config)))
    .toRuntime();
}

/**
 * Parse an expression given the argument signature and body code.
 */
function expression$1(args, code, ctx) {
  // wrap code in return statement if expression does not terminate
  if (code[code.length-1] !== ';') {
    code = 'return(' + code + ');';
  }
  var fn = Function.apply(null, args.concat(code));
  return ctx && ctx.functions ? fn.bind(ctx.functions) : fn;
}

/**
 * Parse an expression used to update an operator value.
 */
function operatorExpression(code, ctx) {
  return expression$1(['_'], code, ctx);
}

/**
 * Parse an expression provided as an operator parameter value.
 */
function parameterExpression(code, ctx) {
  return expression$1(['datum', '_'], code, ctx);
}

/**
 * Parse an expression applied to an event stream.
 */
function eventExpression(code, ctx) {
  return expression$1(['event'], code, ctx);
}

/**
 * Parse an expression used to handle an event-driven operator update.
 */
function handlerExpression(code, ctx) {
  return expression$1(['_', 'event'], code, ctx);
}

/**
 * Parse an expression that performs visual encoding.
 */
function encodeExpression(code, ctx) {
  return expression$1(['item', '_'], code, ctx);
}

/**
 * Parse a set of operator parameters.
 */
function parseParameters$1(spec, ctx, params) {
  params = params || {};
  var key, value;

  for (key in spec) {
    value = spec[key];

    if (value && value.$expr && value.$params) {
      // if expression, parse its parameters
      parseParameters$1(value.$params, ctx, params);
    }

    params[key] = isArray(value)
      ? value.map(function(v) { return parseParameter$2(v, ctx); })
      : parseParameter$2(value, ctx);
  }
  return params;
}

/**
 * Parse a single parameter.
 */
function parseParameter$2(spec, ctx) {
  if (!spec || !isObject(spec)) return spec;

  for (var i=0, n=PARSERS.length, p; i<n; ++i) {
    p = PARSERS[i];
    if (spec.hasOwnProperty(p.key)) {
      return p.parse(spec, ctx);
    }
  }
  return spec;
}

/** Reference parsers. */
var PARSERS = [
  {key: '$ref',      parse: getOperator},
  {key: '$key',      parse: getKey},
  {key: '$expr',     parse: getExpression},
  {key: '$field',    parse: getField$1},
  {key: '$encode',   parse: getEncode},
  {key: '$compare',  parse: getCompare},
  {key: '$subflow',  parse: getSubflow},
  {key: '$itempath', parse: getItemPath}
];

/**
 * Resolve an operator reference.
 */
function getOperator(_, ctx) {
  return ctx.get(_.$ref) || error('Operator not defined: ' + _.$ref);
}

/**
 * Resolve an expression reference.
 */
function getExpression(_, ctx) {
  var k = 'e:' + _.$expr;
  return ctx.fn[k]
    || (ctx.fn[k] = accessor(parameterExpression(_.$expr, ctx), _.$fields, _.$name));
}

/**
 * Resolve a key accessor reference.
 */
function getKey(_, ctx) {
  var k = 'k:' + _.$key;
  return ctx.fn[k] || (ctx.fn[k] = key(_.$key));
}

/**
 * Resolve a field accessor reference.
 */
function getField$1(_, ctx) {
  var k = 'f:' + _.$field + '_' + _.$name;
  return ctx.fn[k] || (ctx.fn[k] = field(_.$field, _.$name));
}

/**
 * Resolve a comparator function reference.
 */
function getCompare(_, ctx) {
  var k = 'c:' + _.$compare + '_' + _.$order;
  return ctx.fn[k] || (ctx.fn[k] = compare(_.$compare, _.$order));
}

/**
 * Resolve an encode operator reference.
 */
function getEncode(_, ctx) {
  var spec = _.$encode,
      encode = {}, name, enc;

  for (name in spec) {
    enc = spec[name];
    encode[name] = accessor(encodeExpression(enc.$expr, ctx), enc.$fields);
    encode[name].output = enc.$output;
  }
  return encode;
}

/**
 * Resolve a recursive subflow specification.
 */
function getSubflow(_, ctx) {
  var spec = _.$subflow;
  return function(dataflow, key, index, parent) {
    var subctx = parseDataflow(spec, ctx.fork(index)),
        op = subctx.get(spec.operators[0].id),
        p = subctx.signals.parent;
    if (p) p.set(parent);
    return op;
  };
}

/**
 * Resolve an iteration index reference.
 */
function getItemPath(_, ctx) {
  return {
    marks:   _.$itempath,
    items:   ctx.itempath,
    context: ctx
  };
}

/**
 * Parse a dataflow operator.
 */
function parseOperator(spec, ctx) {
  if (spec.type === 'Operator' || !spec.type) {
    ctx.operator(spec,
      spec.update ? operatorExpression(spec.update, ctx) : null);
  } else {
    ctx.transform(spec, spec.type);
  }
}

/**
 * Parse and assign operator parameters.
 */
function parseOperatorParameters(spec, ctx) {
  var op, params;
  if (spec.params) {
    if (!(op = ctx.get(spec.id))) {
      error('Invalid operator id: ' + spec.id);
    }
    params = parseParameters$1(spec.params, ctx);
    ctx.dataflow.connect(op, op.parameters(params));
  }
}

/**
 * Parse an event stream specification.
 */
function parseStream$3(spec, ctx) {
  var filter = spec.filter != null ? eventExpression(spec.filter) : undefined,
      stream = spec.stream != null ? ctx.get(spec.stream) : undefined,
      args;

  if (spec.source) {
    stream = ctx.events(spec.source, spec.type, filter);
  }
  else if (spec.merge) {
    args = spec.merge.map(ctx.get.bind(ctx));
    stream = args[0].merge.apply(args[0], args.slice(1));
  }

  if (spec.between) {
    args = spec.between.map(ctx.get.bind(ctx));
    stream = stream.between(args[0], args[1]);
  }

  if (spec.filter) {
    stream = stream.filter(filter);
  }

  if (spec.throttle != null) {
    stream = stream.throttle(+spec.throttle);
  }

  if (spec.debounce != null) {
    stream = stream.debounce(+spec.debounce);
  }

  if (stream == null) {
    error('Invalid stream definition: ' + JSON.stringify(spec));
  }

  if (spec.consume) stream.consume(true);

  ctx.stream(spec, stream);
}

/**
 * Parse an event-driven operator update.
 */
function parseUpdate$1(spec, ctx) {
  var source = ctx.get(spec.source),
      target = null,
      update = spec.update,
      params = undefined;

  if (!source) error('Source not defined: ' + spec.source);

  if (spec.target && spec.target.$expr) {
    target = eventExpression(spec.target.$expr);
  } else {
    target = ctx.get(spec.target);
  }

  if (update && update.$expr) {
    if (update.$params) {
      params = parseParameters$1(update.$params, ctx);
    }
    update = handlerExpression(update.$expr, ctx);
  }

  ctx.update(spec, source, target, update, params);
}

/**
 * Parse a serialized dataflow specification.
 */
function parseDataflow(spec, ctx) {
  var operators = spec.operators || [];

  // parse background
  if (spec.background) {
    ctx.background = spec.background;
  }

  // parse operators
  operators.forEach(function(entry) {
    parseOperator(entry, ctx);
  });

  // parse operator parameters
  operators.forEach(function(entry) {
    parseOperatorParameters(entry, ctx);
  });

  // parse streams
  (spec.streams || []).forEach(function(entry) {
    parseStream$3(entry, ctx);
  });

  // parse updates
  (spec.updates || []).forEach(function(entry) {
    parseUpdate$1(entry, ctx);
  });

  return ctx;
}

/**
 * Context objects store the current parse state.
 * Enables lookup of parsed operators, event streams, accessors, etc.
 * Provides a 'fork' method for creating child contexts for subflows.
 */
function context$2(df, transforms, functions) {
  return new Context(df, transforms, functions);
}

function Context(df, transforms, functions) {
  this.dataflow = df;
  this.transforms = transforms;
  this.events = df.events.bind(df);
  this.signals = {};
  this.scales = {};
  this.nodes = {};
  this.data = {};
  this.fn = {};
  this.itempath = [];
  if (functions) {
    this.functions = functions;
    this.functions.context = this;
  }
}

function ContextFork(ctx, index) {
  this.dataflow = ctx.dataflow;
  this.transforms = ctx.transforms;
  this.functions = ctx.functions;
  this.events = ctx.events;
  this.signals = Object.create(ctx.signals);
  this.scales = Object.create(ctx.scales);
  this.nodes = Object.create(ctx.nodes);
  this.data = Object.create(ctx.data);
  this.fn = Object.create(ctx.fn);
  this.itempath = ctx.itempath.concat(index);
  if (ctx.functions) {
    this.functions = Object.create(ctx.functions);
    this.functions.context = this;
  }
}

Context.prototype = ContextFork.prototype = {
  fork: function(index) {
    var ctx = new ContextFork(this, index);
    (this.subcontext || (this.subcontext = [])).push(ctx);
    return ctx;
  },
  get: function(id) {
    return this.nodes[id];
  },
  set: function(id, node) {
    return this.nodes[id] = node;
  },
  add: function(spec, op) {
    var ctx = this,
        df = ctx.dataflow,
        data;

    ctx.set(spec.id, op);

    if (spec.type === 'Collect' && (data = spec.value)) {
      if (data.$ingest) {
        df.ingest(op, data.$ingest, data.$format);
      } else if (data.$request) {
        df.request(op, data.$request, data.$format);
      } else {
        df.pulse(op, df.changeset().insert(data));
      }
    }

    if (spec.root) {
      ctx.root = op;
    }

    if (spec.parent) {
      var p = ctx.get(spec.parent.$ref);
      df.connect(p, [op]);
      op.targets().add(p);
    }

    if (spec.signal) {
      ctx.signals[spec.signal] = op;
    }

    if (spec.scale) {
      ctx.scales[spec.scale] = op;
    }

    if (spec.data) {
      for (var name in spec.data) {
        data = ctx.data[name] || (ctx.data[name] = {});
        spec.data[name].forEach(function(role) { data[role] = op; });
      }
    }
  },
  operator: function(spec, update, params) {
    this.add(spec, this.dataflow.add(spec.value, update, params, spec.react));
  },
  transform: function(spec, type, params) {
    this.add(spec, this.dataflow.add(this.transforms[type], params));
  },
  stream: function(spec, stream) {
    this.set(spec.id, stream);
  },
  update: function(spec, stream, target, update, params) {
    this.dataflow.on(stream, target, update, params, spec.options);
  }
};

function runtime(view, spec, functions) {
  return parseDataflow(spec, context$2(view, transforms, functions || extendedFunctions));
}

function resizer(view, field) {
  var op = view.add(null,
    function(_) {
      view['_' + field] = _.size;
      view._autosize = view._resize = 1;
    },
    {size: view._signals[field]}
  );
  // set rank to ensure operator runs as soon as possible
  // size parameters should be reset prior to view layout
  return op.rank = 0, op;
}

function autosize(viewWidth, viewHeight, width, height, origin) {
  this.runAfter(function(view) {
    var rerun = 0;

    // clear autosize flag
    view._autosize = 0;

    // width value changed: update signal, skip resize op
    if (view.width() !== width) {
      rerun = 1;
      view.width(width);
      view._resizeWidth.skip(true);
    }

    // height value changed: update signal, skip resize op
    if (view.height() !== height) {
      rerun = 1;
      view.height(height);
      view._resizeHeight.skip(true);
    }

    // view width changed: update view property, set resize flag
    if (view._width !== viewWidth) {
      view._resize = 1;
      view._width = viewWidth;
    }

    // view height changed: update view property, set resize flag
    if (view._height !== viewHeight) {
      view._resize = 1;
      view._height = viewHeight;
    }

    // origin changed: update view property, set resize flag
    if (view._origin[0] !== origin[0] || view._origin[1] !== origin[1]) {
      view._resize = 1;
      view._origin = origin;
    }

    // run dataflow on width/height signal change
    if (rerun) view.run('enter');
  });
}

/**
 * Get or set the current signal state. If an input object is provided,
 * all property on that object will be assigned to signals of this view,
 * and the run method will be invoked. If no argument is provided,
 * returns a hash of all current signal values.
 * @param {object} [state] - The state vector to set.
 * @return {object|View} - If invoked with arguments, returns the
 *   current signal state. Otherwise returns this View instance.
 */
function state(state) {
  var key, skip;
  if (arguments.length) {
    skip = {skip: true};
    for (key in state) this.signal(key, state[key], skip);
    return this.run();
  } else {
    state = {};
    for (key in this._signals) state[key] = this.signal(key);
    return state;
  }
}

/**
 * Create a new View instance from a Vega dataflow runtime specification.
 * The generated View will not immediately be ready for display. Callers
 * should also invoke the initialize method (e.g., to set the parent
 * DOM element in browser-based deployment) and then invoke the run
 * method to evaluate the dataflow graph. Rendering will automatically
 * be peformed upon dataflow runs.
 * @constructor
 * @param {object} spec - The Vega dataflow runtime specification.
 */
function View(spec, options) {
  options = options || {};

  Dataflow.call(this);
  this.loader(options.loader || this._loader);
  this.logLevel(options.logLevel || 0);

  this._el = null;
  this._renderType = options.renderer || Canvas$2;
  this._scenegraph = new Scenegraph();
  var root = this._scenegraph.root;

  // initialize renderer and handler
  this._renderer = null;
  this._handler = new CanvasHandler().scene(root);
  this._queue = null;
  this._eventListeners = [];

  // initialize dataflow graph
  var ctx = runtime(this, spec, options.functions);
  this._runtime = ctx;
  this._signals = ctx.signals;
  this._bind = spec.bindings;

  // initialize scenegraph
  if (ctx.root) ctx.root.set(root);
  root.source = ctx.data.root.input;
  this.pulse(
    ctx.data.root.input,
    this.changeset().insert(root.items)
  );

  // initialize background color
  this._background = ctx.background || null;

  // initialize view size
  this._width = this.width();
  this._height = this.height();
  this._origin = [0, 0];
  this._resize = 0;
  this._autosize = 1;

  // initialize resize operators
  this._resizeWidth = resizer(this, 'width');
  this._resizeHeight = resizer(this, 'height');

  // initialize cursor
  cursor(this);
}

var prototype$69 = inherits(View, Dataflow);

// -- DATAFLOW / RENDERING ----

prototype$69.run = function(encode) {
  Dataflow.prototype.run.call(this, encode);

  var q = this._queue;
  if (this._resize || !q || q.length) {
    this.render(q);
    this._queue = [];
  }

  return this;
};

prototype$69.render = function(update) {
  if (this._renderer) {
    if (this._resize) this._resize = 0, resizeRenderer(this);
    this._renderer.render(this._scenegraph.root, update);
  }
  return this;
};

prototype$69.enqueue = function(items) {
  if (this._queue && items && items.length) {
    this._queue = this._queue.concat(items);
  }
};

// -- GET / SET ----

prototype$69.signal = function(name, value, options) {
  var op = this._signals[name];
  return arguments.length === 1
    ? (op ? op.value : undefined)
    : this.update(op, value, options);
};

prototype$69.scenegraph = function() {
  return this._scenegraph;
};

prototype$69.background = function(_) {
  return arguments.length ? (this._background = _, this._resize = 1, this) : this._background;
};

prototype$69.width = function(_) {
  return arguments.length ? this.signal('width', _) : this.signal('width');
};

prototype$69.height = function(_) {
  return arguments.length ? this.signal('height', _) : this.signal('height');
};

prototype$69.padding = function(_) {
  return arguments.length ? this.signal('padding', _) : this.signal('padding');
};

prototype$69.renderer = function(type) {
  if (!arguments.length) return this._renderType;
  if (type !== SVG && type !== WebGL$2 && type !== None$2) type = Canvas$2;
  if (type !== this._renderType) {
    this._renderType = type;
    if (this._renderer) {
      this._renderer = this._queue = null;
      this.initialize(this._el);
    }
  }
  return this;
};

// -- SIZING ----
prototype$69.autosize = autosize;

// -- DATA ----
prototype$69.data = data;
prototype$69.insert = insert;
prototype$69.remove = remove;

// -- INITIALIZATION ----
prototype$69.initialize = initialize$1;

// -- HEADLESS RENDERING ----
prototype$69.toImageURL = renderToImageURL;
prototype$69.toCanvas = renderToCanvas;
prototype$69.toSVG = renderToSVG;

// -- EVENT HANDLING ----
prototype$69.events = events$1;
prototype$69.finalize = finalize;
prototype$69.hover = hover;

// -- INPUT BINDING ---
prototype$69.bind = bind$1;

// -- SAVE / RESTORE STATE ----
prototype$69.state = state;

transform('Bound', Bound);
transform('Mark', Mark);
transform('Render', Render);
transform('ViewLayout', ViewLayout);

/* eslint-disable no-unused-vars */

exports.Dataflow = Dataflow;
exports.EventStream = EventStream;
exports.Parameters = Parameters;
exports.Pulse = Pulse;
exports.MultiPulse = MultiPulse;
exports.Operator = Operator;
exports.Transform = Transform;
exports.changeset = changeset;
exports.ingest = ingest;
exports.register = register;
exports.definition = definition;
exports.definitions = definitions;
exports.transform = transform;
exports.transforms = transforms;
exports.tupleid = tupleid;
exports.scale = scale;
exports.scheme = getScheme;
exports.projection = projection$1;
exports.View = View;
exports.parse = parse$3;
exports.runtime = parseDataflow;
exports.runtimeContext = context$2;
exports.bin = bin;
exports.bootstrapCI = bootstrapCI;
exports.randomInteger = integer;
exports.randomKDE = randomKDE;
exports.randomMixture = randomMixture;
exports.randomNormal = randomNormal;
exports.randomUniform = randomUniform;
exports.quartiles = quartiles;
exports.accessor = accessor;
exports.accessorName = accessorName;
exports.accessorFields = accessorFields;
exports.id = id;
exports.identity = identity$1;
exports.zero = zero;
exports.one = one;
exports.truthy = truthy;
exports.falsy = falsy;
exports.logger = logger;
exports.None = None;
exports.Warn = Warn;
exports.Info = Info;
exports.Debug = Debug;
exports.array = array$1;
exports.compare = compare;
exports.constant = constant$1;
exports.error = error;
exports.extend = extend;
exports.extentIndex = extentIndex;
exports.field = field;
exports.inherits = inherits;
exports.isArray = isArray;
exports.isFunction = isFunction;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isString = isString;
exports.key = key;
exports.merge = merge$1;
exports.pad = pad;
exports.peek = peek;
exports.repeat = repeat;
exports.splitAccessPath = splitAccessPath;
exports.stringValue = $;
exports.toSet = toSet;
exports.truncate = truncate;
exports.visitArray = visitArray;
exports.loader = loader;
exports.read = read;
exports.inferType = inferType;
exports.inferTypes = inferTypes;
exports.typeParsers = typeParsers;
exports.formats = formats$1;

Object.defineProperty(exports, '__esModule', { value: true });

})));