/*
  Bodiy Lab page runtime.

  Each page keeps its markup in <template id="page-template"> and its logic in a
  `class Component extends DCLogic` script. This file renders the template with
  the values from `renderVals()`, and re-renders in place whenever the page
  calls `setState()`.

  Template syntax used in the pages:
    {{ path }}                 text or attribute value (dotted lookup)
    onClick="{{ handler }}"    event handlers (click, change/input, submit)
    <sc-for list="{{ items }}" as="item">…</sc-for>   repeat
    <sc-if value="{{ flag }}">…</sc-if>               show when truthy
*/
(function () {
  'use strict';

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  var EVENTS = { onclick: 'click', onchange: 'input', oninput: 'input', onsubmit: 'submit' };

  function lookup(expr, scope) {
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (/^(['"]).*\1$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.');
    var cur = scope;
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function interpolate(text, scope) {
    return text.replace(HOLE, function (_, expr) {
      var v = lookup(expr, scope);
      return v == null ? '' : String(v);
    });
  }

  // Build a fresh DOM tree from template nodes and the current values.
  function build(node, scope, out) {
    if (node.nodeType === 3) {
      out.appendChild(document.createTextNode(interpolate(node.nodeValue, scope)));
      return;
    }
    if (node.nodeType !== 1) return;
    var tag = node.tagName.toLowerCase();

    if (tag === 'sc-if') {
      if (lookup((node.getAttribute('value') || '').replace(WHOLE, '$1'), scope)) {
        buildChildren(node, scope, out);
      }
      return;
    }
    if (tag === 'sc-for') {
      var list = lookup((node.getAttribute('list') || '').replace(WHOLE, '$1'), scope) || [];
      var as = node.getAttribute('as') || 'item';
      for (var i = 0; i < list.length; i++) {
        var child = Object.create(scope);
        child[as] = list[i];
        child.$index = i;
        buildChildren(node, child, out);
      }
      return;
    }

    var el = node.namespaceURI === 'http://www.w3.org/2000/svg'
      ? document.createElementNS(node.namespaceURI, node.tagName)
      : document.createElement(node.tagName);
    el.__on = {};
    var attrs = node.attributes;
    for (var a = 0; a < attrs.length; a++) {
      var name = attrs[a].name;
      var raw = attrs[a].value;
      if (name.indexOf('hint-') === 0) continue;
      var whole = raw.match(WHOLE);
      if (EVENTS[name]) {
        if (whole) el.__on[EVENTS[name]] = lookup(whole[1], scope);
        continue;
      }
      var val = whole ? lookup(whole[1], scope) : interpolate(raw, scope);
      if (name === 'value' && (tag === 'input' || tag === 'textarea')) {
        el.__value = val == null ? '' : String(val);
        continue;
      }
      if (val === false && name.indexOf('aria-') !== 0) continue;
      if (val == null) continue;
      el.setAttribute(name, String(val));
    }
    buildChildren(node.content || node, scope, el);
    out.appendChild(el);
  }

  function buildChildren(node, scope, out) {
    var kids = node.childNodes;
    for (var i = 0; i < kids.length; i++) build(kids[i], scope, out);
  }

  // Patch the live DOM to match the freshly built tree, keeping existing
  // elements (and so focus, scroll position and loaded images) where possible.
  function patch(live, next) {
    var a = live.childNodes;
    var b = next.childNodes;
    var i;
    for (i = 0; i < b.length; i++) {
      var n = b[i];
      var l = a[i];
      if (!l) { live.appendChild(n.cloneNode(true)); copyProps(live.lastChild, n); continue; }
      if (l.nodeType !== n.nodeType || l.nodeName !== n.nodeName) {
        var c = n.cloneNode(true); copyProps(c, n);
        live.replaceChild(c, l);
        continue;
      }
      if (n.nodeType === 3) {
        if (l.nodeValue !== n.nodeValue) l.nodeValue = n.nodeValue;
        continue;
      }
      syncAttrs(l, n);
      l.__on = n.__on;
      if (n.__value !== undefined && l.value !== n.__value) l.value = n.__value;
      patch(l, n);
    }
    while (a.length > b.length) live.removeChild(live.lastChild);
  }

  function copyProps(dst, src) {
    if (src.nodeType !== 1) return;
    dst.__on = src.__on;
    if (src.__value !== undefined) dst.value = src.__value;
    for (var i = 0; i < src.childNodes.length; i++) copyProps(dst.childNodes[i], src.childNodes[i]);
  }

  function syncAttrs(l, n) {
    var i;
    for (i = l.attributes.length - 1; i >= 0; i--) {
      var name = l.attributes[i].name;
      if (!n.hasAttribute(name)) l.removeAttribute(name);
    }
    for (i = 0; i < n.attributes.length; i++) {
      var at = n.attributes[i];
      if (l.getAttribute(at.name) !== at.value) l.setAttribute(at.name, at.value);
    }
  }

  // One delegated listener per event type routes to the handler on the element.
  function delegate(root) {
    ['click', 'input', 'submit'].forEach(function (type) {
      root.addEventListener(type, function (e) {
        var t = e.target;
        while (t && t !== root) {
          if (t.__on && typeof t.__on[type] === 'function') { t.__on[type](e); return; }
          t = t.parentNode;
        }
      });
    });
  }

  function DCLogic(props) {
    this.props = props || {};
    this.state = null;
  }
  DCLogic.prototype.setState = function (update) {
    var patchObj = typeof update === 'function' ? update(this.state || {}, this.props) : update;
    this.state = Object.assign({}, this.state || {}, patchObj);
    this.__schedule();
  };
  DCLogic.prototype.forceUpdate = function () { this.__schedule(); };
  window.DCLogic = DCLogic;

  window.mountPage = function (Component) {
    var tpl = document.getElementById('page-template');
    var root = document.getElementById('page');
    var comp = new Component({});
    var queued = false;
    function render() {
      queued = false;
      var frag = document.createDocumentFragment();
      buildChildren(tpl.content, comp.renderVals(), frag);
      patch(root, frag);
    }
    comp.__schedule = function () {
      if (queued) return;
      queued = true;
      (window.requestAnimationFrame || setTimeout)(render);
    };
    delegate(root);
    render();
    if (typeof comp.componentDidMount === 'function') comp.componentDidMount();
    if (location.hash) {
      var target = document.getElementById(location.hash.slice(1));
      if (target) target.scrollIntoView();
    }
  };
})();
