define(['util'],function(util){

    var container;
    var labels;
    var fragmentButtonList = [];
    var inputChangeFrom;
    var inputChangeTo;
    var labelList;
    var inputChangeButton;
    var isReplaced = false;
    var replaceString;

    /**
     * init the expand panel and the DOM event listeners, it must be called before any other method is used
     * @param {Array} labelArray simple string array of the labels
     */
    var init = function(labelArray){
        container = document.getElementById('expand');
        labels = labelArray;
        inputChangeFrom = document.getElementById('fragment-changeFrom');
        inputChangeTo = document.getElementById('fragment-changeTo');
        inputChangeButton = document.getElementById('fragment-changeButton');

        //init text field listener.
        $(inputChangeFrom)
            .on('input', function(){
            addFragmentInputHighlight(inputChangeFrom, labels, labelList);
            })
            .on('blur', function(){
                removeFragmentInputHighlight(labelList);
            })
            .on('focus', function(){
                addFragmentInputHighlight(inputChangeFrom, labels, labelList);
            });

        $(inputChangeTo)
            .on('blur', function(){
                removeFragmentInputHighlight(labelList);
            })
            .on('focus', function(){
                addFragmentInputHighlight(inputChangeFrom, labels, labelList);
            });

        $(inputChangeButton).on('click', function(){
            var isCompleted = true;
            if(!isReplaced){
                //storing these strings
                replaceString = inputChangeFrom.value;
                isCompleted = replaceInputFragment(replaceString, inputChangeTo.value);   //maybe problem
            }else{
                for(var i = 0; i < labelList.length; i ++ ){
                    util.restoreFragment(replaceString, labelList[i]);
                }
            }
            if(isCompleted){
                isReplaced = !isReplaced;
                inputChangeButton.textContent = inputChangeButton.textContent === 'Replace' ? 'Clear' : 'Replace';
            }
        });
    };

//    ==========================================================================
//    =============================Public Functions=============================
//    ==========================================================================

    /**
     * get the fragment from the fragmentsArray and replace them in the labels
     * @param {Array} fragments fragmentArray
     * @param {Array} colors colorsArray
     */
    var sort = function(fragments, colors){
        var fragmentsName = fragments.map(function(e){return e.name});
        fragmentButtonList = [];

        util.listItem(fragmentsName, container, function(el, index){
            var color = colors[index];

            labelList = document.querySelectorAll('.list-label');
            el.className = 'expand-fragment';
            var textNode = el.firstChild;
            var span = document.createElement('span');
            span.appendChild(textNode);
            span.style.backgroundColor = color;
            span.style.color = util.makeComplementColor(color);
            el.appendChild(span);
            // add 'clicked' to listen to the button status.
            span.clicked = false;
            fragmentButtonList.push(span);

            addHoverHighlight(span, fragments[index], labelList);
            addClickToggle(span, fragments[index], labelList, color, fragmentButtonList, fragments);

        });
    };

    /**
     * toggle shorten all fragments method
     * @param {Array} fragments fragmentArray (object Array)
     * @param {Array} colors colorsArray
     */
    var shortenAll = function(fragments, colors){

        var isAllShorted = fragmentButtonList.every(function(e){return e.clicked});

        labelList = document.querySelectorAll('.list-label');
        fragmentButtonList.forEach(function(fragmentButton, index){
           if(isAllShorted){
               bounceButton(fragmentButton,fragments[index], labelList);
           }
           else{
               pressButton(fragmentButton, fragments[index], labelList, colors[index]);
           }
        });
    };

    /**
     * Clear user set fragment replacement, should be called when user extract the expand panel.(also use locally)
     */
    var clearUserInput = function(){
        if(isReplaced){
            isReplaced = false;
            inputChangeButton.textContent = 'Replace';
            for(var i = 0; i < labelList.length; i ++ ){
                util.restoreFragment(replaceString, labelList[i]);
            }
        }
        inputChangeFrom.value = inputChangeTo.value = '';
        replaceString = '';
    };

//    ==========================================================================
//    ===========================Local Help Functions===========================
//    ==========================================================================

    // making the labels highlighting when hover on the element
    var addHoverHighlight = function(el, fragment, labelList){
        $(el).hover(function(){
            fragment.source.forEach(function(sourceIndex){
                labelList[sourceIndex].classList.toggle('label-active');
            });
        });
    };

    //add the click toggle when the fragment are clicked
    var addClickToggle = function(el, fragment, labelList, color, fragmentButtonList, fragments){
        el.addEventListener('click', function(){
            if(el.clicked){
                bounceButton(el, fragment, labelList);
            }
            else{
                pressButton(el, fragment, labelList, color);
            }
            hideLabels(fragmentButtonList, labelList, fragments);
        });
    };

    //display the labels are chosen and hide rest.
    var hideLabels = function(fragmentButtonList, labelList, fragments){
        var isAllShow = fragmentButtonList.every(function(button){
            return button.clicked === false;
        });
        if(isAllShow){
            for(var i = 0; i < labelList.length;i++){
                labelList[i].style.display = '';
            }
        }else{
            for(var j = 0; j < labelList.length;j++){
                labelList[j].style.display = 'none';
            }
            fragmentButtonList.forEach(function(button, i){
                if(button.clicked){
                    console.log('show clicked button');
                    fragments[i].source.forEach(function(originIndex){
                        console.log('show the label list number' + originIndex + 'and the element is' + labelList[originIndex]);
                        labelList[originIndex].style.display = '';
                    });
                }
            });
        }

    };

    //when the fragment button is pressed, replace fragment in labels
    var pressButton = function(fragmentButton, fragment, labelList, color){
        fragment.source.forEach(function(sourceIndex){
            util.replaceFragment(fragment.name, labelList[sourceIndex], color, util.addHover);
        });
        fragmentButton.classList.add('fragment-button-pressed');
        fragmentButton.clicked = true;
    };

    //when the fragment button is pressed again, restore fragment in labels
    var bounceButton = function(fragmentButton, fragment, labelList){
        fragment.source.forEach(function(sourceIndex){
            util.restoreFragment(fragment.name, labelList[sourceIndex]);
        });
        fragmentButton.classList.remove('fragment-button-pressed');
        fragmentButton.clicked = false;
    };

    //highlight the labels which container the input fragment
    var addFragmentInputHighlight = function(inputEl, labelsArray, labelList){
        var textEntered = inputEl.value;
        if(textEntered !== ''){
            labelsArray.forEach(function(label,index){
                labelList[index].classList.remove('label-active');
                if(label.indexOf(textEntered) !== -1){
                    labelList[index].classList.add('label-active');
                }
            });
        }
        else{
            removeFragmentInputHighlight(labelList);
        }
    };

    //remove highlight
    var removeFragmentInputHighlight = function(labelList){
        for(var i = 0; i < labelList.length; i ++ ){
            labelList[i].classList.remove('label-active');
        }
    };

    //return true if replace complete.
    var replaceInputFragment = function(changeFrom, changeTo){
        if(changeFrom && changeFrom.length >= 2){
            if(changeTo ){
                for(var i = 0; i < labelList.length; i ++ ){
                    util.replaceFragment(changeFrom, labelList[i], '#272799', function(el, fragment){
                        util.addHover(el, fragment);
                        el.textContent = changeTo;
                    });
                }
                return true;
            }
            else{
                alert('please set the replace word!')
            }
        }else{
            alert('the fragment you choose is too short');
        }
        return false;
    };

    return {
        init : init,
        sort : sort,
        shortenAll: shortenAll,
        clearUserInput :clearUserInput
    }
});
