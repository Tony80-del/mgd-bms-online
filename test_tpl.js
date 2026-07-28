// This is a minimal reproduction of the template literal that fails
// No HTML context, just the JS template literal

var q = "Q2";
var data = { chambers: [] };
var a = `${
(function(){
  var _s=new Set(),_now=new Date();
  (data.chambers||[]).forEach(function(c){
    if(!c.attendanceDate)return;
    try{
      var _d=new Date(c.attendanceDate);
      if(_d.getFullYear()!==2026||_d>_now)return;
      if(q==="Q2"){if(_d.getMonth()<6)_s.add(c);}else{_s.add(c);}
    }catch(e){}
  });
  return _s.size;
}())
 chambers tracked ${q==="Q2"?"H1":"YTD"}`;

console.log(a);
