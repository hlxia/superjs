!(function(Super, SuperAjax, ObjectUtil, DomUtil) {
  'use strict';

  console.log(
    '    OO  OO      OO        OO   OO OO OO OO   OO OO OO OO   OO OO OO OO     \n' +
    '  OO      OO    OO        OO   OO        OO  OO            OO        OO    \n' +
    '  OO            OO        OO   OO        OO  OO            OO        OO    \n' +
    '    OO  OO      OO        OO   OO OO OO OO   OO OO OO OO   OO OO OO OO     \n' +
    'OO        OO    OO        OO   OO            OO            OO   OO         \n' +
    '  OO     OO      OO      OO    OO            OO            OO      OO      \n' +
    '     OO            OO  OO      OO            OO OO OO OO   OO        OO    \n' +
    '==============================================================================='
  );

  /**
   * Application configuration.
   */
  var Application = {
    baseURL: './',
    modules: {
      add: function (module) {
        return this['SuperModule.'.concat(module.name)] = module;
      },
      get: function (name) {
        return this['SuperModule.'.concat(name)];
      }
    }
  };

  /**
   * Super web application constructor.
   *
   * @param {Object} context The application context.
   * @constructor
   */
  function SuperWebApplication(context) {
    Object.defineProperty(Super, context.name, {
      configurable: false,
      enumerable: false,
      writable: false,
      value: Application = this.instance = new Function('complete',
        'return new function {0}(){complete(this)}'.replace('{0}', context.name)
      )(function(instance) {
        Object.getOwnPropertyNames(
          ObjectUtil.assign(Application, context)
        ).forEach(function(name) {
          Object.defineProperty(instance, name,
            Object.getOwnPropertyDescriptor(
              Application,
              name
            )
          )
        });
      })
    });

    setTimeout(function() {
      if (Application.main) {
        SuperWebMain(function(imports) {
          imports(Application.main);
        });
      };
    });

    console.dir(this);
    console.info(" Super application create => ".concat(
        JSON.stringify(
          Application, 0, 5
        )
      )
    );

  };

  /**
   * Super Web module main.
   *
   * @param factory The module factory function.
   * @returns {SuperModule}
   */
  function SuperWebMain(factory) {
    return new SuperModule(factory)
  };

  /**
   * Super module constructor.
   *
   * @param config The module config information(Name or factory).
   * @returns {SuperModule}
   * @constructor
   */
  function SuperModule(config) {
    var module = this.perfect(config, {
      factory: Function(),
      name: '*'
    });
    module.factory(
      SuperModule.prototype.imports.bind(this),
      SuperModule.prototype.exports.bind(this),
      module
    );
  };

  /**
   * Module public method.
   *
   * @type {
   *   {
   *     loader: SuperModule.loader,
   *     imports: SuperModule.imports,
   *     exports: SuperModule.exports,
   *     importNomaliz: SuperModule.importNomaliz
   *   }
   * }
   */
  SuperModule.prototype = {

    /**
     * Module perfection function.
     *
     * @param config The module configuration(name or factory)
     * @param module The module default information.
     * @returns {SuperModule}
     */
    perfect: function perfect(config, module) {

      /*
       * Make sure module url.
       */
      function makeModuleUrl(module) {
        var url = module.name;
        if (ObjectUtil.isString(config)) {
          url = config;
        }
        if (!/^[\.{1,2}]\//.test(url)) {
          url = Application.baseURL.concat(url);
        }
        if (!/\.js/.test(url)) {
          url = url.concat('.js');
        }
        return url;
      }

      /*
       * Make sure module name.
       */
      function makeModuleName(module) {
        if (ObjectUtil.isString(config)) {
          return config;
        }
        return this.name || module.name;
      }

      /*
       * Make sure module factory.
       */
      function makeModuleFactory(module) {
        if (ObjectUtil.isFunction(config)) {
          return config;
        }
        return this.factory || module.factory;
      }

      return ObjectUtil.assign(this, {
        url: makeModuleUrl.call(this, module),
        name: makeModuleName.call(this, module),
        factory: makeModuleFactory.call(this, module),
      });

    },

    /**
     * Module loader.
     *
     * @param {Object} module The module configuration(name or factory)
     */
    loader: function loader(module) {
      if (module.name) {
        console.log("imports module -> ".concat(module.name));
        var instance = Application.modules.add(
          ObjectUtil.assign(
            new SuperModule(module.name),{
              name: module.name,
              export: {
              }
            }
          )
        );
        var http = new XMLHttpRequest();
        http.open('GET', instance.url, false);
        http.onreadystatechange = function() {
          if (http.readyState === 4 && http.status === 200) {
            Function('SuperModule', http.responseText)(
              Object.defineProperty(SuperModule.bind(instance), 'exports', {
                set: function(exports) {
                  instance.exports = exports;
                }
              })
            )
          }
        };
        http.send();
      }
    },

    /**
     * Module importer.
     *
     * @param {String|Array|Function} modules The module names.
     * @param {Function} callback  The module loading completed call function.
     * @returns {Module} loaded modules.
     */
    imports: function imports(modulesNames, callback) {
      return this.importNomaliz.apply(this, arguments);
    },

    /**
     * Module exporter.
     *
     * @param {*} module  The module export content.
     */
    exports: function exports(module) {
      return this.exportNomaliz.apply(this, arguments);
    },

    /**
     * Module import normalization function.
     *
     * @param {Array<Module>} modules The module list.
     * @param {Object} hook The module hook.
     * @returns {Array<Module>} Modules.
     */
    importNomaliz: function importNomaliz(modulesNames, callback) {

      // import object.
      if (ObjectUtil.isObject(modulesNames)) {
        return modulesNames;
      }

      // import function.
      if (ObjectUtil.isFunction(modulesNames)) {
        return modulesNames.apply(this);
      }

      var hook = {
        each: function(callback) {
          this.each = ObjectUtil.applyFunction(callback);
        },
        then: function(callback) {
          this.then = ObjectUtil.applyFunction(callback);
        }
      };

      new Array().concat(modulesNames).forEach(
        function(name) {
          SuperModule.prototype.loader({
            name: name,
            callback: callback,
            callthen: hook.then,
            calleach: hook.each
          });
        }
      );

      if (ObjectUtil.isString(modulesNames)) {
        return Application.modules.get(modulesNames).exports;
      } else {
        return hook;
      }
    },

    /**
     * Module export normalization function.
     *
     * @param {*} module The export module.
     */
    exportNomaliz: function exportNomaliz(module) {
      this.export = module || {};
    }
  };


  /**
   * Super web application initialization entrance.
   *
   * @type {
   *   {
   *      boostrap: Window.SuperWebApplication.boostrap
   *   }
   * }
   *
   * @example
   *
   * SuperWebApplication.boostrap({
   *   application: {
   *     name: 'xiapsc',
   *     version: '1.0',
   *     main: 'main',
   *     plugs: [],
   *     environments: 'dev',
   *     environments: {
   *       dev: 'environments/environments.dev.json'
   *       prod: 'environments/environments.prod.json'
   *     },
   *   }
   * });
   */
  window.SuperWebApplication = {
    bootstrap : function(config) {
      return new SuperWebApplication(config);
    }
  }

})(this,
  {},
  {
    toString: Object.prototype.toString,
    typeof: function(value) {
      return this.toString.call(value).match(/\[object (.*?)\]/)[1];
    },
    isString: function isString(value) {
      return this.typeof(value) === 'String';
    },
    isFunction: function isFunction(value) {
      return this.typeof(value) === 'Function';
    },
    isObject: function isObject(value) {
      return this.typeof(value) === 'Object';
    },
    isArray: function isArray(value) {
      return this.typeof(value) === 'Array';
    },
    isArguments: function isArguments(value) {
      return this.typeof(value) === 'Arguments';
    },
    isBaseType: function isBaseType(value) {
      return !(
        ~['Object', 'Array', 'Function'].indexOf(
          this.typeof(value)
        )
      );
    },
    assign: function assign(target, source) {
      if (this.isObject(source)) {
        Object.getOwnPropertyNames(source).forEach(function(name){
          Object.defineProperty(target || {}, name,
            Object.getOwnPropertyDescriptor(
              source,
              name
            )
          )
        });
      }
      return target;
    },
    applyFunction: function(fun) {
      if (this.isFunction(fun)) {
        return fun
      }
    }
  },
  {}
);