var app;

app = require('derby').createApp(module);

app.view.fn('remaining', function(todos) {
  var remaining, todo, _i, _len, _ref;
  remaining = 0;
  _ref = todos || [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    todo = _ref[_i];
    if (todo && !todo.completed) {
      remaining++;
    }
  }
  return remaining;
});

app.get('/', function(page) {
  return page.redirect('/home');
});

app.get('/:groupName', function(page, model, _arg, next) {
  var group, groupName;
  groupName = _arg.groupName;
  if (!/^[a-zA-Z0-9_-]+$/.test(groupName)) {
    return next();
  }
  group = model.at("groups." + groupName);
  return group.subscribe(function(err) {
    var id0, id1, id2, todoIds;
    if (err) {
      return next(err);
    }
    todoIds = group.at('todoIds');
    if (!todoIds.get()) {
      id0 = model.add('todos', {
        completed: true,
        text: 'Done already'
      });
      id1 = model.add('todos', {
        completed: false,
        text: 'Example todo'
      });
      id2 = model.add('todos', {
        completed: false,
        text: 'Another example'
      });
      todoIds.set([id1, id2, id0]);
    }
    return model.query('todos', todoIds).subscribe(function(err) {
      var list;
      if (err) {
        return next(err);
      }
      list = model.refList('_page.list', 'todos', todoIds);
      return page.render();
    });
  });
});

app.fn({
  add: function() {
    var i, text, todo, _i, _len, _ref;
    text = this.newTodo.get();
    if (!text) {
      return;
    }
    this.newTodo.del();
    _ref = this.list.get();
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      todo = _ref[i];
      if (todo != null ? todo.completed : void 0) {
        break;
      }
    }
    return this.list.insert(i, {
      text: text,
      completed: false
    });
  },
  del: function(e) {
    return e.at().remove();
  }
});

app.ready(function(model) {
  var from, ul,
    _this = this;
  this.list = model.at('_page.list');
  this.newTodo = model.at('_page.newTodo');
  from = null;
  ul = $('#todos');
  ul.sortable({
    handle: '.handle',
    axis: 'y',
    containment: '#dragbox',
    start: function(e, ui) {
      var item;
      item = ui.item[0];
      return from = ul.children().index(item);
    },
    update: function(e, ui) {
      var item, to;
      item = ui.item[0];
      to = ul.children().index(item);
      return _this.list.pass({
        ignore: item.id
      }).move(from, to);
    }
  });
  return this.list.on('change', '*.completed', function(i, completed, previous, isLocal) {
    if (completed && isLocal) {
      return _this.list.move(i, -1);
    }
  });
});