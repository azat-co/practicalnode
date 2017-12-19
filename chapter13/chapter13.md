Chapter 13
----------
# Node HTTP/2 Servers

It's 2018 and HTTP/2 is already here. It's been here for a few years now. If you are not using HTTP/2 then you are losing out on big improvement. Major browsers already support HTTP/2. A lot of services and websites switched to HTTP/2 already starting in 2016 and continuing this trend in 2017. 

HTTP/2 has very big differences when it comes to delivering traffic. There are multiplexing and the push of assets. If you are not optimizing your code for HTTP/2 then you probably have a slower app than you can have with HTTP/2. Lots of web optimization practices of HTTP/1 are not necessary or might even hurt the loading time with HTTP/2. 

Please educate yourself on HTTP/2 and how to optimize your applications and content for it. In this chapter, we assume you know the major features of HTTP/2 and jump strainght to how to implement an HTTP/2 server in Node as well as to perform some server pushes.

SSL Key and Certificate
=====

But before we can submerge into the HTTP/2 module code, we must do some preparation. You see, the HTTP/2 protocol must use SSL connection. That's when you see `https` in your browser URL address bar and when the browser shows you a lock symbol and you can inspect the secure connection certificate which hopefully was issued by a trusted source.

SSL, https and HTTP/2 are more secure than HTTP/1 or plain http because they are encrypting your traffic between client (browser) and the server. If an attacker tries to hijack it, they'll get only some gibberish. 

For development purposes, you can create a self-signed certificate and the key. 


To create 

HTTP/2 Node Server
====


Node HTTP/2 Server Push 
=====



Summary
=======
