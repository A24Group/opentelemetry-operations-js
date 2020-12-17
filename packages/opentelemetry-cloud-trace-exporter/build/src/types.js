"use strict";
// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkType = exports.Type = void 0;
var Type;
(function (Type) {
    Type[Type["TYPE_UNSPECIFIED"] = 0] = "TYPE_UNSPECIFIED";
    Type[Type["SENT"] = 1] = "SENT";
    Type[Type["RECEIVED"] = 2] = "RECEIVED";
})(Type = exports.Type || (exports.Type = {}));
var LinkType;
(function (LinkType) {
    LinkType[LinkType["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    LinkType[LinkType["CHILD_LINKED_SPAN"] = 1] = "CHILD_LINKED_SPAN";
    LinkType[LinkType["PARENT_LINKED_SPAN"] = 2] = "PARENT_LINKED_SPAN";
})(LinkType = exports.LinkType || (exports.LinkType = {}));
//# sourceMappingURL=types.js.map