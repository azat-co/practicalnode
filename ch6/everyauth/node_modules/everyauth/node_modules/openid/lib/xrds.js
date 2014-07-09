/* A simple XRDS and Yadis parser written for OpenID for node.js
 *
 * http://ox.no/software/node-openid
 * http://github.com/havard/node-openid
 *
 * Copyright (C) 2010 by Håvard Stranden
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  
 * -*- Mode: JS; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*- 
 * vim: set sw=2 ts=2 et tw=80 : 
 */

exports.parse  = function(data)
{
  data = data.replace(/\r|\n/g, '');
  var services = [];
  var serviceMatches = data.match(/<Service\s*(priority="\d+")?\s*?>(.*?)<\/Service>/g);

  if(!serviceMatches)
  {
    return services;
  }

  for(var s = 0, len = serviceMatches.length; s < len; ++s)
  {
    var service = serviceMatches[s];
    var svcs = [];
    var priorityMatch = /<Service\s*priority="(.*)"\s*?>/g.exec(service);
    var priority = 0;
    if(priorityMatch)
    {
      priority = parseInt(priorityMatch[1], 10);
    }

    var typeMatch = null;
    var typeRegex = new RegExp('<Type(\\s+.*?)?>(.*?)<\\/Type\\s*?>', 'g');
    while(typeMatch = typeRegex.exec(service))
    {
      svcs.push({ priority: priority, type: typeMatch[2] });
    }

    if(svcs.length == 0)
    {
      continue;
    }

    var idMatch = /<(Local|Canonical)ID\s*?>(.*?)<\/\1ID\s*?>/g.exec(service);
    if(idMatch)
    {
      for(var i = 0; i < svcs.length; i++)
      {
        var svc = svcs[i];
        svc.id = idMatch[2];
      }
    }
    
    var uriMatch = /<URI(\s+.*?)?>(.*?)<\/URI\s*?>/g.exec(service);
    if(!uriMatch)
    {
      continue;
    }

    for(var i = 0; i < svcs.length; i++)
    {
      var svc = svcs[i];
      svc.uri = uriMatch[2];
    }

    var delegateMatch = /<(.*?Delegate)\s*?>(.*)<\/\1\s*?>/g.exec(service);
    if(delegateMatch)
    {
      svc.delegate = delegateMatch[2];
    }

    services.push.apply(services, svcs);
  }

  services.sort(function(a, b) 
  { 
    return a.priority < b.priority 
      ? -1 
      : (a.priority == b.priority ? 0 : 1);
  });

  return services;
}
