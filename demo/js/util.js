/**
 * Created by HCN9FE on 21.08.2014.
 * Utility library for creating DOM elements list, make colors and add hovering functions.
 */

define(['Please'],function(please){

    var start = new Date().getTime();
    var filter = Array.prototype.filter;
    var uniColor = true; //TODO

    var markTime = function(text){
        return (function(){
            var time = new Date().getTime();
            console.log('%c' +text + (time - start), "color:red");
        }())
    };

    /**
     * list Items
     * @param {Array} array
     * @param {Element} container
     * @param {Function} [fn] callback function works on every item(which is element)
     */
    var listItem = function(array, container, fn){
        array.forEach(function(element, index){
            var listElement = document.createElement('div');
            var listText    = document.createTextNode(element);

            listElement.appendChild(listText);
            container.appendChild(listElement);

            fn(listElement, index);
        });
    };
    /**
     * replace the certain fragment in one list
     * @param {String} fragment
     * @param {Node} node
     * @param {Color} color
     * @param {Function} [fn] callback functions on replace element
     */
    var replaceFragment = function(fragment, node, color, fn){
        var nodeList = node.childNodes;
        if(nodeList.length > 0){
            var filteredTextNode = filter.call(nodeList, function(i) {
                return i.nodeType === Node.TEXT_NODE ;
            });
            for(var i = 0; i < filteredTextNode.length; i++){
                var currentNode = filteredTextNode[i];
                var text = currentNode.textContent;
                var index = text.indexOf(fragment);
                if(index >= 0){
                    var before = document.createTextNode(text.slice(0, index));
                    var after = document.createTextNode(text.slice(index + fragment.length));

                    var replaceText = fragment.charAt(0) + fragment.length;
                    var elContent = document.createElement('span');
                    elContent.setAttribute('style', 'background-color : ' + color + ';color:' + makeComplementColor(color));
                    elContent.className = 'fragment-' + fragment;
                    var replaceTextNode = document.createTextNode(replaceText);
                    elContent.appendChild(replaceTextNode);

                    if(before) node.insertBefore(before, currentNode);
                    if(after) node.insertBefore(after, currentNode.nextSibling);
                    node.replaceChild(elContent , currentNode);

                    //execute the callback function
                    if(fn) fn(elContent, fragment);
                }
            }
        }
    };

    /**
     * check if the node has shorted the fragment and toggle the shortening part
     * @param {String} fragment name
     * @param  node
     * @param {Function} [fn] callback function(nodeEl, spanEl) on replace element
     * @return {Boolean} if restoration is executed
     */
    var restoreFragment = function(fragment, node, fn){
        var spanList = node.querySelectorAll('span');
        var found = false;

        if(spanList.length > 0){
            for(var i = 0 ; i < spanList.length; i ++){
                var spanEl = spanList[i];
                if(spanEl.className === 'fragment-' + fragment){
                    found = true;
                    spanEl.parentNode.removeChild(spanEl.nextSibling);//remove the tooltip first
                    var next = spanEl.nextSibling;
                    var previous = spanEl.previousSibling;
                    if(next && next.nodeType === 3){
                        next.textContent  = fragment + next.textContent;
                    }else if(previous && previous.nodeType === 3){
                        previous.textContent = previous.textContent + fragment;
                    }else{
                        var fragmentTextNode = document.createTextNode(fragment);
                        spanEl.parentNode.insertBefore(fragmentTextNode, next);
                    }
                    //execute callback function if existed
                    if(fn) fn(node, spanEl);
                    spanEl.parentNode.removeChild(spanEl);
                }
            }
        }
        node.normalize();
        return found;
    };

    /**
     * to replace a list with a list of fragment
     * @param {NodeList} labelList a string array to be replaced
     * @param {Array} fragmentList a string array to replace the labels
     * @param {Array} replaceColors a color array
     */
    var replaceList = function(labelList, fragmentList, replaceColors){
        fragmentList.forEach(function (fragment, index) {
            for (var i = 0; i < labelList.length; i++) {
                replaceFragment(fragment, labelList[i], replaceColors[index], addHover);
            }
        });
    };

    /**
     * Help function to make the tooltip for the replaced fragment
     * @param {Element} spanElement span container element
     * @param {String} fragment the tooltip name
     */
    var addHover = function (spanElement, fragment) {
        var tooltip = document.createElement('div');
        tooltip.appendChild(document.createTextNode(fragment));
        spanElement.parentNode.insertBefore(tooltip, spanElement.nextSibling);

        tooltip.className = 'tooltip';
        tooltip.style.top = spanElement.style.top - 10;
        tooltip.style.left = spanElement.style.left + 10;
        $(tooltip).hide();

        $(spanElement).mousemove(function (e) {

            $(tooltip).css('top', e.pageY - 30);
            $(tooltip).css('left', e.pageX + 20);

            //Show the tooltip with faceIn effect
            $(tooltip).fadeIn('500');
        }).mouseout(function () {
            $(tooltip).fadeOut();
        });
    };

    /**
     * Make a number of colors with or without baseColor
     * @param number the numbers of color to be made
     * @param {Color} [baseColor] the base color
     * @returns {Array} return the colors array
     */
    var makeColors = function(number, baseColor){
        if(uniColor){
            return Array.apply(null, new Array(number)).map(function(){return '#272799'}); // TODO 0065d1
        }
        if(!baseColor)
        return please.make_color({
            golden: false,
            colors_returned : number
        });
        else
        return please.makeColor({
            golden: false,
            color_returned : number,
            base_color     : baseColor
        });
    };

    /**
     * Make a complement color base one color
     * @param {Color} color a hex color value
     * @returns {String} complementary hex color
     */
    var makeComplementColor = function(color){
        if(uniColor) return 'white';
        var hexColor = please.HEX_to_HSV(color);
        return please.make_scheme(hexColor ,{
            scheme_type: 'complement', //set scheme type
            format: 'hex' //give it to us in rgb
        })[1];
    };

    return {
        markTime : markTime,
        listItem : listItem,
        replaceFragment : replaceFragment,
        restoreFragment : restoreFragment,
        makeColor : makeColors,
        makeComplementColor : makeComplementColor,
        replaceList : replaceList,
        addHover : addHover
    }
});
