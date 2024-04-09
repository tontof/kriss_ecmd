function createElement(name, cls, parent) {
  let elt = document.createElement(name);
  if (cls) {
    elt.className = cls;
  }
  if (parent) {
    parent.appendChild(elt);
  }
  return elt;
}

function createTextNode(elt, text) {
  let textNode = document.createTextNode(text);
  elt.appendChild(textNode);
}

function unwrap(elt) {
  if (elt && elt.parentNode) {
    while (elt.firstChild) {
      elt.parentNode.insertBefore(elt.firstChild, elt);
    }
    elt.remove();
  }
}

function toggleOrientation(o) {
  return o=="left"?"right":"left";
}

function selectionOrientation() {
  let selection = document.getSelection();
  if (!selection.isCollapsed) {
    let range = document.createRange();
    range.setStart(selection.anchorNode, selection.anchorOffset);
    range.setEnd(selection.focusNode, selection.focusOffset);
    if (range.collapsed) {
      return "left";
    } else {
      return "right";
    }
  }

  return null;
}

function selectionUnwrap(tagName) {
  let parentNode = selectionParentNode();
  let tag = selectionWrap('kriss');
  parentNode.querySelectorAll('*:empty').forEach((elt) => elt.remove());
  parentNode.outerHTML = parentNode.outerHTML.replace('<kriss>', '</'+parentNode.nodeName.toLowerCase()+'>').replace('</kriss>', '<'+parentNode.nodeName.toLowerCase()+'>').replaceAll('<'+tagName+'></'+tagName+'>', '');
}

function selectionWrap(tagName) {
  selectedText = window.getSelection();
  selectedRange = selectedText.getRangeAt(0);
  tag = document.createElement(tagName);
  let extract = selectedRange.extractContents();
  tag.appendChild(extract);
  removeEmptyTag(tag)
  selectedRange.insertNode(tag);
  removeEmptyTag(tag.parentNode)
  return tag;
}

/*
 * Replace selection
 * <a>a#</a>b<c>#c</c>
 * by
 * <a>a</a>#b#<c>c</c>
 * and always from left to right
 */
function updateSelection() {
  let selection = document.getSelection();
  if (selection.toString().length > 0) {
    let orientation = selectionOrientation();
    // move selection cursor # to be the closest from text selection
    selection.modify('extend',toggleOrientation(orientation),'character');
    selection.modify('extend',orientation,'character');
    let focusNode = selection.focusNode;
    let focusOffset = selection.focusOffset;
    orientation = toggleOrientation(orientation);
    while(document.getSelection().toString() != "") {
      selection.modify('extend',orientation,'character');
    }
    let range = document.createRange();
    if (orientation == 'right') { 
      range.setStart(focusNode, focusOffset);
      range.setEnd(selection.focusNode, selection.focusOffset);
    } else {
      range.setEnd(focusNode, focusOffset);
      range.setStart(selection.focusNode, selection.focusOffset);
    }
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

function selectionParentNode() {
  let selection = document.getSelection();
  let parentNode = null;
  if (selection.anchorNode) {
    parentNode = selection.anchorNode;
    if (parentNode.nodeName == '#text') {
      parentNode = parentNode.parentNode;
    }
    while (!(parentNode.contains(selection.anchorNode) && parentNode.contains(selection.focusNode))) {
      parentNode = parentNode.parentNode;
    }
  }
  return parentNode;
}

function textareaInput(evt) {
  let textarea = evt.target;
  textarea.parentNode.contenteditableTag.innerHTML = textarea.value;
  updateEcmd();
}

function contenteditableInput(evt) {
  let contenteditable = evt.target;
  updateSource(contenteditable.ecmd);
}

function btnSourceClick(evt) {
  let textarea = evt.target.parentNode.parentNode.querySelector('textarea');
  textarea.classList.toggle('visible');
  textarea.parentNode.classList.toggle('focused');
}

function updateEcmd() {
  document.querySelectorAll('[contenteditable]').forEach((elt) => {
    if (elt.ecmd) {
      elt.ecmd.style.top = elt.getBoundingClientRect().bottom+'px';
    }
  });
}

function updateSource(ecmd) {
  let textarea = ecmd.querySelector('textarea');
  let contenteditable = ecmd.contenteditableTag;
  textarea.value = contenteditable.innerHTML;
  updateEcmd();
}

function btnSource(bar, ecmd) {
  let btnSource = createElement('button', 'btn-src', bar);
  createTextNode(btnSource, '</>');
  btnSource.type = "button";
  btnSource.addEventListener('click', btnSourceClick);
  let textarea = ecmd.querySelector('textarea');
  let contenteditable = ecmd.contenteditableTag;
  textarea.addEventListener('input', textareaInput);
  contenteditable.addEventListener('input', contenteditableInput);
  updateSource(ecmd);
}

function hasParentTag(elt, tagName) {
  while(elt.parentNode) {
    if (elt.nodeName.toLowerCase() == tagName) {
      return elt;
    }
    elt = elt.parentNode;
  }
  return false;
}

function getContenteditableSelection() {
  let elt = selectionParentNode();

  while(elt.parentNode) {
    if (elt.hasAttribute('contenteditable')) {
      return elt;
    }
    elt = elt.parentNode;
  }

  return null;
}

function btnTagClick(evt) {
  if (window.getSelection().toString().length > 0) {
    let ecmd = evt.target.parentNode.parentNode;
    if (ecmd.contenteditableTag === getContenteditableSelection()) {
    let tagName = evt.target.getAttribute('data-tag');
    let tag = selectionWrap(tagName)
    let parentNode = tag.parentNode
    let parentTag = hasParentTag(tag.parentNode, tagName);
    
    if (tag.querySelector(tagName)) {
      tag.querySelectorAll(tagName).forEach((elt) => unwrap(elt))
      unwrap(tag)
    } else if (parentTag !== false) {
      parentNode = parentTag.parentNode
      splitTag(parentTag, tag);
    }
    mergeDuplicates(parentNode)
        
    document.getSelection().empty();
    updateSource(ecmd);
    }
  }
}

function btnTag(bar, text, tagName) {
  let btnSource = createElement('button', 'btn-'+tagName, bar);
  createTextNode(btnSource, text);
  btnSource.type = "button";
  btnSource.setAttribute('data-tag', tagName);
  btnSource.addEventListener('click', btnTagClick);
}

function btnLinkClick(evt) {
  if (window.getSelection().toString().length > 0) {
    let ecmd = evt.target.parentNode.parentNode;
    if (ecmd.contenteditableTag === getContenteditableSelection()) {
    let tagName = 'a';
    let tag = selectionWrap(tagName)
    let parentNode = tag.parentNode
    let parentTag = hasParentTag(tag.parentNode, tagName);
    
    if (tag.querySelector(tagName)) {
      tag.querySelectorAll(tagName).forEach((elt) => unwrap(elt))
      unwrap(tag)
    } else if (parentTag !== false) {
      parentNode = parentTag.parentNode
      splitTag(parentTag, tag);
    } else {
      tag.setAttribute('href', prompt('link?'));
    }
    mergeDuplicates(parentNode);
    document.getSelection().empty();
    updateSource(ecmd);
    }
  }
}

function btnLink(bar, text) {
  let btnSource = createElement('button', 'btn-link', bar);
  createTextNode(btnSource, text);
  btnSource.type = "button";
  btnSource.addEventListener('click', btnLinkClick);
}

function removeEmptyTag(tag) {
  if (tag) {
    tag.querySelectorAll('*:empty').forEach((elt) => elt.remove());
    tag.childNodes.forEach((node) => {
      if (node.textContent.length === 0) {
        node.remove()
      }
    })
    if (tag.textContent == "") {
      tag.remove()
    }
  }
}

function splitTag(parentTag, tag) {
  let cloneParentTag = parentTag.cloneNode(true);
  let cloneTag = cloneParentTag.querySelector(tag.nodeName)
  removeBefore(parentTag, tag);
  removeAfter(cloneParentTag, cloneTag);
  tag.remove();
  cloneTag.remove();
  parentTag.parentNode.insertBefore(cloneParentTag, parentTag);
  parentTag.parentNode.insertBefore(tag, parentTag);
  unwrap(tag);
  removeEmptyTag(parentTag)
  removeEmptyTag(cloneParentTag)
}  

function removeBefore(root, ref) {
  let seen = false;
  let nodesToRemove = [];
  let removeBeforeChild = function(node, ref) {
    if (node === ref) {
      seen = true;
    } else {
      node.childNodes.forEach((child) => removeBeforeChild(child, ref));
    }
    if (!seen && node !== ref && !node.contains(ref)) {
      nodesToRemove.push(node);
    }
  }
  removeBeforeChild(root, ref);
  nodesToRemove.forEach((elt) => elt.parentNode.removeChild(elt));
}

function removeAfter(root, ref) {
  let seen = false;
  let nodesToRemove = [];
  let removeAfterChild = function(node, ref) {
    if (node === ref) {
      seen = true;
    } else {
      node.childNodes.forEach((child) => removeAfterChild(child, ref));
    }
    if (seen && node !== ref && !node.contains(ref)) {
      nodesToRemove.push(node);
    }
  }
  removeAfterChild(root, ref);
  nodesToRemove.forEach((elt) => elt.parentNode.removeChild(elt));
}

function mergeTags(tag1, tag2) {
  tag1.appendChild(tag2);
  unwrap(tag2);
}

function isMergeable(tag1, tag2) {
  if (tag1.nodeName.toLowerCase() === 'a') {
    if (tag1.getAttribute('href') != tag2.getAttribute('href')) {
      return false;
    }
  }
  return true;
}

// reverse childNodes to replace for and i--?
function mergeDuplicates(tag) {
  if (tag) {
    removeEmptyTag(tag)
    for(i = 0; i < tag.childNodes.length - 1; i++) {
      let tag1 = tag.childNodes[i];
      let tag2 = tag.childNodes[i].nextSibling;
      if (tag.childNodes[i].nodeName !== "#text" && tag1.nodeName == tag2.nodeName && isMergeable(tag1, tag2)) {
        mergeTags(tag.childNodes[i], tag.childNodes[i].nextSibling);
        i--;
      }
    }
  }
}

function krissEcmd(elt) {
  elt.contenteditable = "contenteditable";
  let ke = createElement('div', 'kriss-ecmd', document.body);
  let keNav = createElement('nav', null, ke);
  let keTextarea = createElement('textarea', null, ke);
  ke.contenteditableTag = elt;
  elt.ecmd = ke;
  btnSource(keNav, ke);
  btnTag(keNav, 'h1', 'h1');
  btnTag(keNav, 'b', 'strong');
  btnTag(keNav, 'i', 'em');
  btnLink(keNav, 'link');
}

document.querySelectorAll('[contenteditable]').forEach((elt) => krissEcmd(elt));


