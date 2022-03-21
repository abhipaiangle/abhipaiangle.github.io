const view_url = 'http://localhost:4209/getViewElements'
const click_url = 'http://localhost:4209/getClickElements'
const response_url = 'http://localhost:4209/getResponse'

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());

gtag('config', 'G-RF37WPQBJC');

function extractContent(html) {
    return new DOMParser().parseFromString(html, "text/xml").firstChild.innerHTML;
}

function findByString(str, type) {
    // console.log(str)
    if (type === 'Dynamic') {
        var tags = str.split("=-=-=-=-=")
        // console.log(tags)
        tag_0 = tags[0].match(/<([^\s>]+)(\s|>)+/)[1];
        attrs_0 = tags[0].match(/([^\s="]+="[^"]+")|([^\s=']+='[^']+')/g);
        if (tags.length > 1) {
            tag_1 = tags[1].match(/<([^\s>]+)(\s|>)+/)[1];
            attrs_1 = tags[1].match(/([^\s="]+="[^"]+")|([^\s=']+='[^']+')/g);
            com_attrs = attrs_0.filter(element => attrs_1.includes(element));
            for (let j = 2; j < tags.length; j++){
                var tag = tags[j].match(/<([^\s>]+)(\s|>)+/)[1];
                var attrs = tags[j].match(/([^\s="]+="[^"]+")|([^\s=']+='[^']+')/g);
                com_attrs = com_attrs.filter(element => attrs.includes(element));
            }
        }
        else {
            com_attrs = attrs_0
        }
        tag = tag_0
        // console.log(com_attrs)
    }
    else {
        // console.log(str)
        var tag = str.match(/<([^\s>]+)(\s|>)+/)[1];
        var com_attrs = str.match(/([^\s="]+="[^"]+")|([^\s=']+='[^']+')/g);
        // console.log(com_attrs)
    }

    var possibleTags;
    if (com_attrs == null) {
        possibleTags = document.getElementsByTagName(tag)
    }
    else {
        // console.log(com_attrs)
        var q = tag + com_attrs.map(t => '[' + t + ']').join('');
        // console.log(q)
        possibleTags = document.querySelectorAll(q)
    }
    var found;
    // if(str.match(/<\/.+?>/g)==null){
    //     found = possibleTags[0]
        
    // }
    // else{
    //     for (var i = 0; i < possibleTags.length; i++) {
    //         console.log(possibleTags[i].innerHTML)
    //         if (possibleTags[i].innerHTML == extractContent(str)) {
    //             found = possibleTags[i];
    //             break;
    //         }
    //         else if (possibleTags[i].innerHTML == '') {
    //             found = possibleTags[i];
    //             break;
    //         }
    //     }
    // }
    found = possibleTags // doesnt check innerHTML, uncomment and debug above code for innerHTML verification
    // console.log(possibleTags)
    return found;

}

async function fetchTagData() {
    const [viewTags, clickTags] = await Promise.all([
        fetch(view_url),
        fetch(click_url)
    ])

    const viewElements = await viewTags.json()
    const clickElements = await clickTags.json()

    return [viewElements, clickElements]

}
async function fetchResponse(ga) {
    
    var xmlHttp = new XMLHttpRequest()
    xmlHttp.open("POST", response_url, false)
    xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xmlHttp.send(JSON.stringify(ga))
    let res = await xmlHttp.responseText
    // console.log(res)
    return res
}

function getURL(href) {
    console.log(href)
    let base = 'https://www.croma.com' //for local
    // let base = window.location.origin //for global
    let url = base + href
    return url
}

document.addEventListener("DOMContentLoaded", function (event){
    fetchResponse().then((response) => {
    //console.log(response)
})
    
fetchTagData().then(([viewElements, clickElements]) => {
    //console.log(viewElements);
    // console.log(clickElements);

    for (var i = 0; i < viewElements.length; i++) {
      
        createObserver(i);
    }
    for (var i = 0; i < clickElements.length; i++) {
        let button = findByString(clickElements[i].tag, clickElements[i].event_type)
        let action = clickElements[i].action
        let category = clickElements[i].category
        let label = clickElements[i].label
        let value = clickElements[i].value

        if (clickElements[i].event_type == 'Static') {
            button[0].onclick = function () {
                gtag('event', action, {
                    'event_category': category,
                    'event_label': label,
                    'value': value
                });
            console.log(action+' Event sent to GA')
            }
        }
        else if (clickElements[i].event_type == 'Dynamic') {
            // console.log(button)
            for (let x = 0; x < button.length; x++){
                button[x].onclick = function () {
                    var url = getURL(button[x].pathname)
                    let ga = {
                        'url': url,
                        'event': "Click",
                        'type': "Dynamic",
                        'action': action,
                        'category': category,
                        'label': label,
                        'value': value
                    }
                    fetchResponse(ga).then((ga) => {
                        gtag('event', ga["action"], {
                            'event_category': ga["category"],
                            'event_label': ga["label"],
                            'value': ga["value"]
                        });
                    alert(ga + " Event sent to GA")
                    })
                }
            }
        }
    }

    function createObserver(i) {
        let observer;

        let options = {
            root: null,
            rootMargin: "0px",
            threshold: 1.0
        };
 

        observer = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
            if (entry.isIntersecting) {

                gtag('event', viewElements[i].action, {
                    'event_category': viewElements[i].category,
                    'event_label': viewElements[i].label,
                    'value': viewElements[i].value
                });
                console.log(viewElements[i].action + ' Event sent to GA')

            }
        }));
        observer.observe(findByString(viewElements[i].tag));

    }
})
})