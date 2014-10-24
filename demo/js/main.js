
require.config({
    baseUrl: "./js",
    paths : {
        "jquery": "//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min"
    }
});

require(['SuffixTrieRelease', 'array', 'jquery', 'util','expandPanel'], function (SuffixTrie, array, $, util, list) {
    var trie = new SuffixTrie();
    console.log("my tree is loaded!", trie);
    util.markTime('ready to start');
    trie.build(array);

//    =============================create element=========================
    var fragmentsArray = trie.weightByAverage();
    //make corresponding colors
    var colors = util.makeColor(fragmentsArray.length);

    var fragmentsName = fragmentsArray.map(function (e) {
        return e.name
    });

    var fragmentsEl = document.getElementById('fragments');
    var listEl = document.getElementById('list');

    util.listItem(fragmentsName.slice(0, 2), fragmentsEl, function(el, index){
        var color = colors[index];
        el.className = "list-fragment";
        el.style.backgroundColor = color;
        el.style.color = util.makeComplementColor(color);
    });
    util.listItem(array, listEl, function(e){e.className = "list-label"});
    var labelList = listEl.querySelectorAll('.list-label');

    var expandButtonEl = document.createElement('button');
    expandButtonEl.textContent = '-->';
    expandButtonEl.className = 'expand-button';
    fragmentsEl.appendChild(expandButtonEl);

    var expandEl = document.getElementById('expand');
    var originEl = document.getElementById('origin');
//    expandEl.style.height = originEl.offsetHeight + 'px';
    console.log('height is' + originEl.offsetHeight);
    var position = $(originEl).offset();
    expandEl.style.left = position.left + originEl.offsetWidth + 'px';
    expandEl.style.top = position.top + 'px';

    var bySpeedButton = document.getElementById('bySpeed');
    var byPerformanceButton = document.getElementById('byPerformance');
    var shortAllButton = document.getElementById('shortAll');

    var rebuildLabelList = function(){
        $(labelList).remove();
        util.listItem(array, listEl, function(e){e.className = "list-label"});
        labelList = listEl.querySelectorAll('.list-label');
    };

//    =============================create DOM event=========================

    var expandElWidth = expandEl.offsetWidth;
    expandEl.style.width = 0;
    expandButtonEl.addEventListener('click', function(){
        switch(expandEl.offsetWidth){
            case expandElWidth :
                $(expandEl).animate(
                    {width : 0},'fast');
                list.clearUserInput();
                util.replaceList(labelList, fragmentsName.slice(0,2), colors);
                toggleListFragmentDisplay();
                $('.expand-fragment').remove();
                break;
            case 0 :
                $(expandEl).animate(
                    {width : expandElWidth},
                    'fast'
                );
                toggleListFragmentDisplay();
                rebuildLabelList();
                list.sort(fragmentsArray, colors);
        }
    });

    var toggleListFragmentDisplay = function(){
        var listFragments = document.getElementsByClassName('list-fragment');
        for(var i = 0; i < listFragments.length; i ++){
            listFragments[i].style.visibility = listFragments[i].style.visibility === 'hidden' ? 'visible' : 'hidden';
        }
    };

    var setButtonListener = function(button, sortFunction){
        button.addEventListener('click', function(){
            rebuildLabelList();

            $('.expand-fragment').fadeOut(500, function(){
                $('.expand-fragment').remove();
                fragmentsArray = sortFunction.call(trie);//TODO
                var newColors = util.makeColor(fragmentsArray.length);
                list.sort(fragmentsArray, newColors);
                byPerformanceButton.disabled = !byPerformanceButton.disabled;
                bySpeedButton.disabled = !bySpeedButton.disabled;
            });
        });
    };

    setButtonListener(bySpeedButton, trie.weightByAverage);
    setButtonListener(byPerformanceButton, trie.weightByMax);
    shortAllButton.addEventListener('click', function(){
        list.shortenAll(fragmentsArray,colors);
    });

//    =============================replace fragment=========================

    util.replaceList(labelList, fragmentsName.slice(0,2), colors);

//    =============================init expand panel=========================
    bySpeedButton.disabled = true;
    list.init(array);


});
