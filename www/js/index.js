var db;

$('#reposHome').bind('pageinit', function (event) {
    loadRepos();
    db = window.openDatabase("repodb", "0.1", "GitHub Repo Db", 1000);
    db.transaction(createDb, txError, txSuccess);
});

function createDb(tx) {
    tx.executeSql("DROP TABLE IF EXISTS repos");
    tx.executeSql("CREATE TABLE repos(user,name)");
}

function txError(error) {
    console.log(error);
    console.log("Database error: " + error);
}

function txSuccess() {
    console.log("Success");
}

function saveFave() {
    db = window.openDatabase("repodb", "0.1", "GitHub Repo Db", 1000);
    db.transaction(saveFaveDb, txError, txSuccessFave);
}

function saveFaveDb(tx) {
    var owner = getUrlVars().owner;
    var name = getUrlVars().name;

    tx.executeSql("INSERT INTO repos(user,name) VALUES (?, ?)", [owner, name]);
}

function txSuccessFave() {
    console.log("Save success");

    disableSaveButton();
}

function checkFave() {
    db.transaction(checkFaveDb, txError);
}

function checkFaveDb(tx) {
    var owner = getUrlVars().owner;
    var name = getUrlVars().name;

    tx.executeSql("SELECT * FROM repos WHERE user = ? AND name = ?", [owner, name], txSuccessCheckFave);
}

function txSuccessCheckFave(tx, results) {
    console.log("Read success");
    console.log(results);

    if (results.rows.length)
        disableSaveButton();
}

function alertDismissed() {
    $.mobile.changePage("index.html");
}

function disableSaveButton() {
    // change the button text and style
    var ctx = $("#saveBtn").closest(".ui-btn");
    $('span.ui-btn-text', ctx).text("Saved").closest(".ui-btn-inner").addClass("ui-btn-up-b");

    $("#saveBtn").unbind("click", saveFave);
}

$('#favesHome').live('pageshow', function (event) {
    db.transaction(loadFavesDb, txError, txSuccess);
});

function loadFavesDb(tx) {
    tx.executeSql("SELECT * FROM repos", [], txSuccessLoadFaves);
}

function txSuccessLoadFaves(tx, results) {
    console.log("Read success");

    if (results.rows.length) {
        var len = results.rows.length;
        var repo;
        for (var i = 0; i < len; i = i + 1) {
            repo = results.rows.item(i);
            console.log(repo);
            $("#savedItems").append("<li><a href='repo-detail.html?owner=" + repo.user + "&name=" + repo.name + "'>" + "<h4>" + repo.name + "</h4>" + "<p>" + repo.user + "</p></a></li>");
        };
        $('#savedItems').listview('refresh');
    } else {
        if (navigator.notification)
            navigator.notification.alert("You haven't saved any favorites yet.", alertDismissed);
        else
            alert("You haven't saved any favorites yet.");
    }
}

function loadRepos() {
    $.ajax("https://api.github.com/legacy/repos/search/javascript").done(function (data) {
        var i, repo;
        $.each(data.repositories, function (i, repo) {
            $("#allRepos").append("<li><a href='repo-detail.html?owner=" + repo.username + "&name=" + repo.name + "'>" + "<h4>" + repo.name + "</h4>" + "<p>" + repo.username + "</p></a></li>");
        });
        $('#allRepos').listview('refresh');
    });
}

$('#reposDetail').live('pageshow', function (event) {
    var owner = getUrlVars().owner;
    var name = getUrlVars().name;
    loadRepoDetail(owner, name);
    checkFave();
    $("#saveBtn").bind("click", saveFave);
});

function loadRepoDetail(owner, name) {
    $.ajax("https://api.github.com/repos/" + owner + "/" + name).done(function (data) {
        var repo = data;
        console.log(data);

        $('#repoName').html("<a href='" + repo.homepage + "'>" + repo.name + "</a>");
        $('#description').text(repo.description);
        $('#forks').html("<strong>Forks:</strong> " + repo.forks + "<br><strong>Watchers:</strong> " + repo.watchers);

        $('#avatar').attr('src', repo.owner.avatar_url);
        $('#ownerName').html("<strong>Owner:</strong> <a href='" + repo.owner.url + "'>" + repo.owner.login + "</a>");
    });
}


function getUrlVars() {
    var vars = [],
        hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for (var i = 0; i < hashes.length; i++) {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars;
}