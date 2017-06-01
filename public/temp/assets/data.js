var EMPTY_FN = function () { },
    NONE = 'none';
function getRandomDates (len, returnValue) {
    var day = 1, months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct', 'Nov','Dec'],
           year = 2015,month = 0,arr = [];

    for (i = 0; i < len; i++) {
       if (month === 11 && day === 31) {
           year++;
           month = 0;
       }
       if (day > 30 || (month === 1 && day === 28)) {
           day = 1;
           month++;
       }
       if (month > 11) {
           month = 0;
       }


       date = new Date(year, month, day);
       millis = date.getTime();

       dateStr = day + '-' + months[month] + '-' + year;

       switch (returnValue) {
          case 'millis':
            arr.push(millis);
            break;
          case 'date':
            arr.push(date);
            break;
          case 'string':
            arr.push(dateStr);
            break;
       }
       day++;
   }
   return arr;
}

function getRandomSeries (len) {
    var arr = [];

    for (i = 0; i < len; i++) {
       arr.push(Math.floor(Math.random() * 10));
    }
    return arr;
}

function getRandomCandleSeries (len) {
    var arr = [],
        open,
        high,
        low,
        close;

    for (i = 0; i < len; i++) {
       open = Math.floor(Math.random() * 10);
       close = Math.floor(Math.random() * 10);
       high = Math.floor(Math.random() * 10);
       low = Math.floor(Math.random() * 10);

       arr.push([open, high, low, close]);
    }

    return arr;
}

var data = {
    chart: {
      container: {
          paddingX: 10,
          paddingY: 10,
          group: {
              className: 'fusioncharts-root'
          },
          bound: {
              className: 'fusioncharts-root-container',
              style: {
                  stroke: NONE,
                  fill: NONE
              }
          }
      },
      axes: [{
          x: {
            major: {
                tick: {
                    hide: false,
                    length: 5,
                    style: {
                        stroke: '#9A9A9A',
                        'stroke-width': '1'
                    }
                },
                text: {
                    hide: false,
                    style: {
                        'font-weight': 'bold',
                        'font-size': '12px',
                        fill: '#686868',
                        'font-family': 'Myriad pro Semibold, sans-serif'
                    }
                }
            },
            minor: {
                tick: {
                    hide: false,
                    length: 5,
                    style: {
                        stroke: '#BBBBBB',
                        'stroke-width': '1'
                    }
                },
                text: {
                    hide: false,
                    style: {
                        'font-size': '10px',
                        'font-weight': 'bold',
                        fill: '#656565',
                        'font-family': 'Myriad pro Semibold, sans-serif'
                    }
                }
            },
            margin: {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            }
        },
          y: {
            major: {
                tick: {
                    hide: false,
                    style: {
                        stroke: '#707070',
                        'stroke-width': '1'
                    }
                },
                text: {
                    hide: false,
                    style: {
                        'font-size': '10px',
                        fill: '#707070',
                        'font-family': 'Myriad pro Semibold, sans-serif'
                    }
                }
            },
            margin: {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0
            }
        }
      }],

      datasets: [{
        category: {
            dateformat: '%e-%b-%Y',
            data: getRandomDates(2000, 'string') // Generate Random date strings
        },
        dataset: [
            {
                uid: 'ds-1',
                series: [
                    {
                        plot: {
                            type: "column"
                        },
                        style: {
                            fill: function (colorPalette, index, lib) {
                                return lib.hashify(colorPalette[index]);
                            },
                            'stroke-width': 1
                        },
                        name: "Column",
                        data: getRandomSeries(2000)
                    },
                    {
                        plot: {
                            type: "line"
                        },
                        style: {
                            stroke: function (colorPalette, index, lib) {
                                return lib.hashify(colorPalette[index]);
                            },
                            'stroke-width': 2
                        },
                        name: "Line",
                        data: getRandomSeries(2000)
                    },
                    {
                        plot: {
                            type: "area"
                        },
                        style: {
                            fill: function (colorPalette, index, lib) {
                                return lib.hashify(colorPalette[index]);
                            },
                            'stroke-width': 2,
                            'stroke-opacity': '0.1',
                            'fill-opacity': '0.7'

                        },
                        name: "Area",
                        data: getRandomSeries(2000)
                    },
                    {
                        plot: {
                            type: "candlestick"
                        },
                        style: {
                            fill: '#ff0000'
                        },
                        name: "Candlestick",
                        data: getRandomCandleSeries(2000)
                    }
                ]
            }
        ],
      }],

      canvas: [{
          className: 'fusioncharts-canvas-container',
          style: {
              fill: '#ffffff',
              stroke: 'none',
              'fill-opacity': '0',
              'border-top': '1px #aaaaaa solid',
              'border-right': '1px #aaaaaa solid',
              'border-bottom': '1px #aaaaaa solid',
              'border-left': '1px #aaaaaa solid'
          },
          margin: {
              top: 0,
              right: 0,
              left: 0,
              bottom: 0
          },
          markers: {
              group: {
                  className: 'fusioncharts-markers',
                  style: {
                      'font-family': 'Myriad pro Semibold, sans-serif',
                      'font-size': '14px'
                  }
              },
              cyclic: [{
                  level: function (formalNames) {
                      return formalNames.LONG_YEAR.index
                  },
                  start: function (formalNames) {
                      return ['DEC', formalNames.SHORT_MONTH, '15', formalNames.DAY_OF_MONTH]
                  },
                  end: function (formalNames) {
                      return ['FEB', formalNames.SHORT_MONTH, '31', formalNames.DAY_OF_MONTH]
                  },
                  timeSpan: {
                      regular: {
                          plotBand: {
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-regular-plotBand',
                                  style: {
                                      fill: function (colorPalette, index, lib) {
                                          return lib.hashify(colorPalette[index]);
                                      },
                                      stroke: '#898989',
                                      'stroke-opacity': 0.5,
                                      'fill-opacity': 0.5
                                  }
                              }
                          },
                          label: {
                              margin: {
                                  top: 5,
                                  bottom: 0,
                                  left: 5
                              },
                              text: 'Cyclic1',
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-regular-label',
                                  style: {
                                      fill: '#3c3b3b'
                                  }
                              }
                          }
                      },
                      alternate: {
                          plotBand: {
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-alternate-cyclic',
                                  style: {
                                      fill: function (colorPalette, index, lib) {
                                          return lib.hashify(colorPalette[index + 4]);
                                      },
                                      stroke: '#898989',
                                      'stroke-opacity': 0.5,
                                      'fill-opacity': 0.5
                                  }
                              }
                          },
                          label: {
                              margin: {
                                  top: 5,
                                  bottom: 0,
                                  left: 5
                              },
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-alternate-label',
                                  style: {
                                      fill: '#3c3b3b'
                                  }
                              }
                          }
                      }
                  },
                  timeInstant: {
                      regular: {
                          label: {
                              margin: {
                                  top: 5,
                                  bottom: 0,
                                  left: 5
                              },
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-label',
                                  style: {
                                      fill: '#3c3b3b'
                                  }
                              }
                          },
                          plotLine: {
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-plotLine',
                                  style: {
                                      'fill-opacity': 1,
                                      'stroke': '#d83131',
                                      'stroke-dasharray': 5,
                                      'stroke-width': 2
                                  }
                              }
                          },
                          labelBound: {
                              margin: {
                                  bottom: 5,
                                  left: 0,
                                  top: 0
                              },
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-labelBound',
                                  style : {
                                      fill: '#ffffff',
                                      'stroke-width': 1.5,
                                      'stroke': '#d83131'
                                  }
                              }
                          },
                          refLabel: {
                              margin: {
                                  bottom: 5,
                                  left: 0,
                                  top: 0
                              },
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-bottomLabel',
                                  style: {
                                      fill: '#353535'
                                  }
                              }
                          }
                      }
                  }
              },{
                  level: function (formalNames) {
                      return formalNames.LONG_YEAR.index
                  },
                  start: function (formalNames) {
                      return ['APR', formalNames.SHORT_MONTH]
                  },
                  duration: function () {
                      return 3;
                  },
                  step: function () {
                      return 3;
                  },
                  timeSpan: {
                      regular: {
                          plotBand: {
                              group: {
                                  style: {
                                      fill: '#FEE5E5'
                                  }
                              }
                          },
                          label: {
                              text: 'Quarter',
                              group: {
                                  style: {
                                      fill: '#BCA9A9'
                                  }
                              }
                          }
                      },
                      alternate: {
                          plotBand: {
                              group: {
                                  style: {
                                      fill: '#FFFFFF'
                                  }
                              }
                          },
                          label: {
                              group: {
                                  style: {
                                      fill: '#BCA9A9'
                                  }
                              }
                          }
                      }
                  }
              },{
                  level: function (formalNames) {
                      return formalNames.LONG_YEAR.index
                  },
                  start: function (formalNames) {
                      return ['DEC', formalNames.SHORT_MONTH, '15', formalNames.DAY_OF_MONTH]
                  },
                  timeInstant: {
                      regular: {
                          label: {
                              text: 'Cyclic1'
                          }
                      }
                  }
              }],
              acyclic: [{
                  level: function (formalNames) {
                      return formalNames.LONG_YEAR.index
                  },
                  start: function (formalNames) {
                      return ['2018', formalNames.LONG_YEAR, 'JUN', formalNames.SHORT_MONTH, '31', formalNames.DAY_OF_MONTH]
                  },
                  end: function (formalNames) {
                      return ['2020', formalNames.LONG_YEAR, 'JUL', formalNames.SHORT_MONTH, '10', formalNames.DAY_OF_MONTH]
                  },
                  timeSpan: {
                      regular: {
                          plotBand: {
                              group: {
                                  className: 'fusioncharts-markers-acylic-timeSpan-regular-plotBand',
                                  style: {
                                      fill: '#b5c1e2',
                                      stroke: '#898989',
                                      'stroke-opacity': 0.5,
                                      'fill-opacity': 0.5
                                  }
                              }
                          },
                          label: {
                              margin: {
                                  top: 5,
                                  bottom: 0,
                                  left: 5
                              },
                              name: 'M.Tech',
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-label',
                                  style: {
                                      fill: '#7f7f7f'
                                  }
                              }
                          }
                      }
                  },
                  timeInstant: {
                      regular: {
                          label: {
                              margin: {
                                  top: 5,
                                  bottom: 0,
                                  left: 5
                              },
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-label',
                                  style: {
                                      fill: '#7f7f7f'
                                  }
                              }
                          },
                          plotLine: {
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-plotLine',
                                  style: {
                                      'fill-opacity': 1,
                                      'stroke': '#cea310',
                                      'stroke-dasharray': 0,
                                      'stroke-width': 2
                                  }
                              }
                          },
                          labelBound: {
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-labelBound',
                                  style : {
                                      fill: '#cea310',
                                      'stroke-width': 0
                                  }
                              }
                          },
                          refLabel: {
                              margin: {
                                  bottom: 5,
                                  top: 0,
                                  left: 0
                              },
                              group: {
                                  className: 'fusioncharts-markers-cylic-timeSpan-timeInstant-bottomLabel',
                                  style: {
                                      fill: '#cea310'
                                  }
                              }
                          }
                      }
                  }
              },{
                level: function (formalNames) {
                    return formalNames.LONG_YEAR.index
                },
                start: function (formalNames) {
                    return ['DEC', formalNames.SHORT_MONTH, '15', formalNames.DAY_OF_MONTH]
                },
                timeInstant: {
                    regular: {
                        label: {
                            text: 'Cyclic1'
                        }
                    }
                }
            }]
          },
          divlines: {
              hide: false,
              className: 'fusioncharts-canvas-divlines',
              style: {
                  fill: '#F3F3F3',
                  stroke: '#cecece',
                  'fill-opacity': 0.5
              }
          },
          aggregation: function (){},
          axes: function (store) {
              return store.getAxesByIndex(0);
          },
          dataset: function (store) {
              return store.getDatasetsByIndex(0);
          }
      }],

      navigator: {
        style: {
            fill: '#FFFFFF',
            stroke: 'none',
            'fill-opacity': 1,
            'border-top': '1px #aaaaaa solid',
            'border-right': '0px #ffffff solid',
            'border-bottom': '0px #aaaaaa solid',
            'border-left': '0px #ffffff solid'
        },
        leftButton: {
            rect: {
                style: {
                    fill: '#ffffff',
                    stroke: '#9e9e9e',
                    'fill-opacity': 1,
                    'border-top': '2px #aaaaaa solid',
                    'border-right': '0px #ffffff solid',
                    'border-bottom': '2px #aaaaaa solid',
                    'border-left': '0px #ffffff solid',
                    r: 2
                }
            },
            arrow: {
                style: {
                    stroke: '#717171'
                }
            }
        },
        rightButton: {
            rect: {
                style: {
                    fill: '#ffffff',
                    stroke: '#9e9e9e',
                    'fill-opacity': 1,
                    'border-top': '2px #aaaaaa solid',
                    'border-right': '0px #ffffff solid',
                    'border-bottom': '2px #aaaaaa solid',
                    'border-left': '0px #ffffff solid',
                    r: 2
                }
            },
            arrow: {
                style: {
                    stroke: '#717171'
                }
            }
        },
        selectionBox: {
            style: {
                fill: '270-rgba(254, 254, 254, .4):30-rgba(230, 230, 230, .4):70',
                stroke: '#A9A9A9'
            }
        },
        scroller: {
            step: 0.2,
            scrollHeight: 14,
            // @private attributes.
            margin: {
                top: 2,
                left: 2,
                right: 2
            },
            style: {
                trackerRect: {
                    fill: '#F3F6F6',
                    'stroke-width': 0
                },
                scrollerRect: {
                    fill: '#CDD2D2',
                    stroke: '#2b2b2a',
                    'stroke-width': 0
                },
                goti: {
                    fill: '#333333',
                    stroke: '#2b2b2a',
                    'stroke-width': 1
                },
                leftButton: {
                    fill: '#CDD2D2',
                    stroke: '#bfbdbd',
                    'stroke-width': 0
                },
                rightButton: {
                    fill: '#CDD2D2',
                    stroke: '#bfbdbd',
                    'stroke-width': 0
                },
                leftButtonArrow: {
                    fill: '#434343',
                    stroke: '#9e9e9e',
                    'stroke-width': 0
                },
                rightButtonArrow: {
                    fill: '#434343',
                    stroke: '#9e9e9e',
                    'stroke-width': 0
                },
                container: {

                }
            }
        },
        label: {
            name: 'GMT',
            style: {
                'font-family': 'MyriadPro',
                'font-size': 12,
                fill: '#C8C8C8'
            }
        },
        axes: {
            x: {
                minor: {
                    tick: {
                        hide: false,
                        length: 5,
                        style: {
                            stroke: '#D7D7D7',
                            'stroke-width': '1'
                        }
                    },
                    text: {
                        hide: false,
                        style: {
                            'font-weight': 'bold',
                            'font-size': '12px',
                            fill: '#C6C6C6',
                            'font-family': 'Myriad pro Semibold, sans-serif'
                        }
                    }
                },
                major: {
                    tick: {
                        hide: false,
                        length: 5,
                        style: {
                            stroke: '#9A9A9A',
                            'stroke-width': '1'
                        }
                    },
                    text: {
                        hide: false,
                        style: {
                            'font-weight': 'bold',
                            'font-size': '12px',
                            fill: '#686868',
                            'font-family': 'Myriad pro Semibold, sans-serif'
                        }
                    }
                }
            }
        },
        margin: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        }
      },


      legend: [{
        box: {
            style: {
                fill: '#ffffff',
                stroke: '#000000',
                'stroke-opacity': '1',
                'stroke-width': 0
            }
        },
        text: {
            style: {
                'font-family': 'MyriadPro',
                'font-size': 14,
                fill: '#7f7f7f'
            }
        },
        margins: {
            top: 0,
            bottom: 0,
            right: 0,
            left: 10
        },
        preDrawHook: function centerAlign() {
            var self = this,
                parentsArr = self.getParents(),
                canvas = parentsArr[0].cacheByName('canvasContainer'),
                // parent = parentsArr[parentsArr.length - 2],
                config = this.config;
            // wrt canvas.
            // center align.
            config.x = canvas.getX() + canvas.getWidth() / 2 - self.getWidth() / 2;
            // left align
            // config.x = canvas.getX();
            // right align...
            // config.x = (parent.getX() + parent.getWidth()) - space.width;




            // // wrt chart
            // // center align.
            // config.x =
            // // left align

            // // right align...
        },
        layout: function (obj) {
            return obj.block;
        },
        position: function (obj) {
            return obj.bottom;
        },
        orientation: function (obj) {
            return obj.horizontal;
        },
        alignment: function (obj) {
            return obj.left;
        },
        symbol: {
            shapeType: 'rect',
            width: 20,
            height: 12,
            borderRadius: 1
        }
      }],


      crossline: [{
          style: {
              stroke: '#7f7f7f',
              'stroke-width': 2
          },
          marker: {
              radius: '4',
              style: {
                  'stroke-width': 2,
                  'stroke': '#ffffff'
              }
          }
      }],

      tooltip: [{
          separator: ': ',
          dateFormat: '%A, %B %d, %Y'
      }],

      caption:[{
        margin: {
            top: 10,
            bottom: 10,
            left: 0,
            right: 0
        },

        preDrawHook: function centerAlign() {
            var self = this,
                parentsArr = self.getParents(),
                canvas = parentsArr[0].cacheByName('canvasContainer'),
                // parent = parentsArr[parentsArr.length - 2],
                config = this.config;
            // wrt canvas.
            // center align.
            config.x = canvas.getX() + canvas.getWidth() / 2 - self.getWidth() / 2;
            // left align
            // config.x = canvas.getX();
            // right align...
            // config.x = (parent.getX() + parent.getWidth()) - space.width;




            // // wrt chart
            // // center align.
            // config.x =
            // // left align

            // // right align...
        },

        padding: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        },
        interpadding: 10,
        group: {
            className: 'fusioncharts-caption',
            style: {
                'font-family': 'Myriad pro Semibold, sans-serif',
                'font-weight': 'bold',
                'fill': '#525252'
            }
        },
        bound: {
            className: 'fusioncharts-caption-container',
            style: {
                stroke: NONE,
                fill: NONE
            }
        },
        title: {
            className: 'fusioncharts-caption-title',
            text: 'Basic Elements',
            style: {
                'font-size': '14px'
            }
        },
        subtitle: {
            className: 'fusioncharts-caption-subtitle',
            text: 'Sub-caption',
            style: {
                'font-size': '11px',
                'fill': '#7b7b7b'
            }
        }
      }]
    }
};
