function ajaxGetJson(url) {
  var jqXHR = $.ajax({
    type: "GET",
    url: url,
    dataType: "json"
  });
  return jqXHR;
}

function getMonsterInfo() {
  elementEnable(false, "normal");
  var useKeyword = $("[name=radio]:checked").val();
  var url = useKeyword === "1" ? document.getElementById("keyword").value : "通常モンスター";
  url = "/info?keyword=" + encodeURI(url);
  var jsonXHR = ajaxGetJson(url);
  jsonXHR.done(function(response) {
    response.text =  response.text.replace(/\r?\n/g, "<br />");
    $("#name").html(response.name);
    $("#text").html(response.text);
  });
  jsonXHR.fail(function() {
  });
  
  jsonXHR.always(function() {
    elementEnable(true, "normal");
  });
}

function elementEnable(bool, elementId) {
  if (bool) {
    document.getElementById(elementId).disabled = "";
  } else {
    document.getElementById(elementId).disabled = "true";
  }
}
